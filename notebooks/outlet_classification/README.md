# DATASCI 266: Final Project

## Headline Evaluation and Style Independency in Journalism
####  Rafael Arbex-Murut, Yeshwanth Somu

The intention of this project is to quantify predictability in journalism. We accomplished this by analyzing the relationships between the headlines of articles, the bodies of articles, and their respective editorial sources. We measured the propensity of news outlets to have descriptive headlines for their own articles, and on the same dataset, we also measured the uniqueness of news sources’ editorial styles.

## Data 

We used the [*All the News*](https://www.kaggle.com/datasets/snapcrack/all-the-news) dataset, which can be downloaded from Kaggle.  This dataset includes over 140,000 news articles from 15 different American publications. The dataset was built from RSS feeds, thus capturing the most prominent articles of each publication.

## Repo Structure

Our analysis is broken into two subdirectories. The notebooks within the subdirectories are ordered by the execution order.

    ├── Headline Evaluation                             
       ├── Determining Pegasus Parameters.ipynb        
       ├── Determining T5 Parameters.ipynb             
       ├── Evaluation Headlines Pegasus.ipynb          
       ├── Evaluation Headlines T5.ipynb               
       └── Visuals Headline Evaluation.ipynb           
    ├── News Outlet Classification                      
       ├── Full Classification.ipynb                   # News outlet classification done on the full set of 12 news outlets
       └── Subset Classification.ipynb                 # Follow-up classification done on the subset of 6 news outlets
    └── README.md


