import copy
import os
import random

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import classification_report
from sklearn.model_selection import StratifiedKFold, train_test_split
from torch.utils.data import DataLoader, SubsetRandomSampler
from tqdm import trange
from tqdm.auto import tqdm
from transformers import get_scheduler

from evaluation.model_specification import modelspecifications


class Trainer:

    def __init__(self, number_of_folds: int, model: str, batch_size: int, task: str,max_epoch:int, eval_only: bool, max_length: int):
        self.seed = 42
        self.set_random_seed()
        self.max_length = max_length
        self.model_name = model
        self.eval_only = eval_only
        self.max_length = max_length
        self.number_of_folds = number_of_folds
        self.batch_size = batch_size
        self.task = task
        self.max_epoch = max_epoch
        self.device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")


    def set_random_seed(self):
        random.seed(self.seed)
        np.random.seed(self.seed)
        torch.manual_seed(self.seed)

        if torch.cuda.is_available():
            torch.cuda.manual_seed(self.seed)
            torch.cuda.manual_seed_all(self.seed)
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.benchmark = False

    def load_data(self):
        data_path = os.getcwd() + "/datasets/mbib-full/" + self.task + ".csv"
        df = pd.read_csv(data_path)
        return df

    def tokenize_data(self, df, tokenizer):
        tokenized = []
        print("Tokenizing...")
        for i in tqdm(range(len(df))):
            tok = tokenizer(df.iloc[i]['text'], padding="max_length",truncation=True)
            tok['input_ids'] = torch.tensor(tok['input_ids'])
            tok['attention_mask'] = torch.tensor(tok['attention_mask'])
            tok['labels'] = torch.tensor(df.iloc[i]['label'])
            if 'token_type_ids' in tok.keys():
              tok['token_type_ids'] = torch.tensor(tok['token_type_ids'])
            tokenized.append(tok)

        return tokenized

    def evaluate(self,model,dl):
        num_steps = len(dl)
        progress_bar = tqdm(range(num_steps))

        loss = 0
        predictions = []
        truth = []
        

        model.eval()
        for batch in dl:
            labels = list(batch['labels'].detach().cpu().numpy())

            batch = {k: v.to(self.device) for k, v in batch.items()}
            with torch.no_grad():
                outputs = model(**batch)
            logits = outputs.logits
            loss += outputs.loss
            predictions.extend(torch.argmax(logits, dim=-1))
            truth.extend(labels)

            progress_bar.update(1)

        loss = loss/num_steps
        predictions = torch.stack(predictions).cpu()
        report = classification_report(truth, predictions, target_names=['non-biased', 'biased'],
                                               output_dict=True)
        return loss, report

    def fit(self,model,optimizer,lr_scheduler,train_dl,dev_dl):
        num_training_steps = self.max_epoch * len(train_dl)
        last_loss = 100
        patience = 1
        trigger = 0

        for epoch in trange(self.max_epoch, desc='Epoch'):
            progress_bar = tqdm(range(len(train_dl)))
            # train on whole train set
            model.train()
            for batch in train_dl:
                optimizer.zero_grad()
                batch = {k: v.to(self.device) for k, v in batch.items()}
                outputs = model(**batch)
                loss = outputs.loss
                loss.backward()
                optimizer.step()
                lr_scheduler.step()
                progress_bar.update(1)

            # eval
            dev_loss,_ = self.evaluate(model,dev_dl)

            # check early stopping
            if dev_loss >= last_loss:
                trigger += 1
                if trigger >= patience:
                    print('Early stopping...')
                    break
            else:
                trigger = 0
            last_loss = dev_loss

        return model


    def run(self):

        model, tokenizer, lr = modelspecifications(name=self.model_name, model_length=self.max_length)

        # prepare data
        df = self.load_data()
        tokenized_df = self.tokenize_data(df,tokenizer)
        skfold = StratifiedKFold(n_splits=self.number_of_folds, shuffle=True, random_state=self.seed)
        scores = []
        for train_idx, dev_idx in skfold.split(np.arange(len(df)),df['dataset_id'].to_list()):
            dev_idx, test_idx = train_test_split(dev_idx, test_size=0.75, train_size=0.25, random_state=42, shuffle=True)

            train_sampler = SubsetRandomSampler(train_idx)
            dev_sampler = SubsetRandomSampler(dev_idx)
            test_sampler = SubsetRandomSampler(test_idx)

            train_dl = DataLoader(tokenized_df, batch_size=self.batch_size, sampler=train_sampler)
            dev_dl = DataLoader(tokenized_df, batch_size=self.batch_size, sampler=dev_sampler)
            test_dl = DataLoader(tokenized_df, batch_size=self.batch_size, sampler=test_sampler)

            
            fold_model = copy.deepcopy(model)
            fold_model.to(self.device)
            #setup training params
            optimizer = torch.optim.AdamW(fold_model.parameters(), lr=lr)
            lr_scheduler = get_scheduler(
                "cosine",
                optimizer=optimizer,
                num_warmup_steps=0,
                num_training_steps=self.max_epoch * len(train_dl)
            )

            if self.eval_only:
                trained_model = fold_model
            else:
                trained_model = self.fit(fold_model,optimizer,lr_scheduler,train_dl,dev_dl)

            eval_loss, report = self.evaluate(trained_model,test_dl)
            scores.append(report['weighted avg']['f1-score'])
        return sum(scores)/self.number_of_folds