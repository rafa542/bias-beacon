# Zips the plugin for deployment

import zipfile
import os

def zipdir():
    path = 'bb_plugin/'  # Path to the plugin directory
    ziph = zipfile.ZipFile('bb_plugin.zip', 'w', zipfile.ZIP_DEFLATED)
    
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file),
                       os.path.relpath(os.path.join(root, file), os.path.join(path, '..')))
    
    ziph.close()
    print("bb_plugin directory zipped successfully.")

if __name__ == '__main__':
    zipdir()