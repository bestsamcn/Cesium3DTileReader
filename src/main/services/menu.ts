import { Menu, screen, BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';


function getTemplate(updator?:any) {
	return [
		{
			label: '刷新',
			role: 'reload',
		},
		{
			label: '更新',
			click(){
				updator!.doUpdate(false);
			},
		},
	]
}

export function init(updator?:any) {
	log.info('(menu) init');
	const menu = Menu.buildFromTemplate(getTemplate(updator));
	Menu.setApplicationMenu(menu);
	// Menu.setApplicationMenu(null);
}
