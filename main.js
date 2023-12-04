const { app, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const updateFeed = 'https://github.com/vishal-nagar744/Test';

// Set the update feed URL
autoUpdater.setFeedURL({ url: updateFeed });
autoUpdater.autoDownload = false;
autoUpdater.checkForUpdates();

function downloadUpdate(updateURL) {
  const updateFileName = 'update.zip'; // Name of the downloaded update file
  const filePath = path.join(app.getPath('temp'), updateFileName); // Path to save the downloaded file

  const fileStream = fs.createWriteStream(filePath);
  const req = request.get(updateURL);

  req.on('response', (response) => {
    if (response.statusCode !== 200) {``
      console.error('Update download failed:', response.statusMessage);
      return;
    }

    req.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close(() => {
        extractUpdate(filePath);
      });
    });

    fileStream.on('error', (err) => {
      console.error('Error writing update file:', err.message);
    });
  });

  req.on('error', (err) => {
    console.error('Error downloading update:', err.message);
  });
}

function extractUpdate(filePath) {
  const zip = new AdmZip(filePath);
  const extractPath = path.join(app.getPath('userData'), 'updates'); // Path to extract the update

  try {
    fs.mkdirSync(extractPath, { recursive: true }); // Create directory if it doesn't exist
    zip.extractAllTo(extractPath, true);
    applyUpdate(extractPath);
  } catch (err) {
    console.error('Error extracting update:', err.message);
  }
}

function applyUpdate(extractPath) {
  const appPath = app.getAppPath(); // Path to the app's installation directory
  const appResourcesPath = path.join(appPath, 'resources');

  try {
    fs.readdirSync(extractPath).forEach((file) => {
      const srcPath = path.join(extractPath, file);
      const destPath = path.join(appResourcesPath, file);

      if (fs.existsSync(destPath)) {
        // Create backup directory if needed
        const backupDir = path.join(app.getPath('userData'), 'backup');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir);
        }
        // Create backup of existing file
        fs.copyFileSync(destPath, path.join(backupDir, file + '.backup'));
      }
      // Copy update file to app resources
      fs.copyFileSync(srcPath, destPath);
    });

    console.log('Update successfully applied! Please restart the application.');
  } catch (err) {
    console.error('Error applying update:', err.message);
  }
}


autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, updateURL) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      downloadUpdate(updateURL);
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('Error fetching updates:', error.message);
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    message: 'Update available. Do you want to download it?',
    buttons: ['Yes', 'No'],
  }).then((response) => {
    if (response.response === 0) {
      // Handle downloading updates here
    }
  });
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);