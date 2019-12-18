import { create, getPath } from './window';
import { screen } from 'electron';
import path from 'path';

export function init() {
	let display = screen.getPrimaryDisplay(); //可以获取界面信息
	const win = create({
		width: 500,
		height: 400,
		minWidth: 500,
		minHeight: 400,


		webPreferences: {
			//添加成 Nodejs，即可解决require的环境问题
			nodeIntegration: true,
		},

		icon: path.join($dirname, 'icons', 'icon.ico')
	});
	win.loadURL(getPath());
	return win;
}
