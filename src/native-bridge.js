import {registerPlugin} from '@capacitor/core';
// Le bridge n'est actif que dans l'app Android générée par Capacitor.
window.CPRNativePrint=registerPlugin('CPRPrint');
