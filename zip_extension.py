# Zips the plugin for deployment

import zipfile
import os

def zipdir(path, ziph):
    
    # ziph is zipfile handler
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file),
                       os.path.relpath(os.path.join(root, file),
                                       os.path.join(path, '..')))

if __name__ == '__main__':
    zipf = zipfile.ZipFile('bb_plugin.zip', 'w', zipfile.ZIP_DEFLATED)
    zipdir('bb_plugin/', zipf)
    zipf.close()
    print("bb_plugin directory zipped successfully.")
