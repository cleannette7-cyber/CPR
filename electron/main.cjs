const {app, BrowserWindow, shell} = require('electron');
const path = require('node:path');
let win;
function createWindow() {
  win=new BrowserWindow({
    title:'CPR Gestion',width:1320,height:900,minWidth:350,minHeight:480,
    backgroundColor:'#132c47',icon:path.join(__dirname,'../assets/icon-512.png'),
    autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,
      webSecurity:true,webviewTag:false,allowRunningInsecureContent:false}
  });
  // Pas de navigation arbitraire vers des pages non fiables à l'intérieur de l'application.
  win.webContents.setWindowOpenHandler(({url})=>{
    if(/^https:\/\//i.test(url)) shell.openExternal(url);
    return {action:'deny'};
  });
  win.webContents.on('will-navigate',(event,url)=>{
    if(!url.startsWith('file://'+path.join(__dirname,'../www/').replaceAll('\\','/'))){
      event.preventDefault();
      if(/^https:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  win.loadFile(path.join(__dirname,'../www/index.html'));
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
