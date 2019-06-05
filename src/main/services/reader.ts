import { readFile, textDecoder, toArrayBuffer, getB3DMData, createBox } from "../utils";
import { Matrix4, Cartesian3, Matrix3, TileOrientedBoundingBox } from 'cesium';
import { ipcMain } from 'electron';

const fs = require("fs");
let tree:any[] = [];
let level = 0;
let transform = null;

// const args = process.argv.slice(2);
let input = '';
let output = '';
let filename = 'tileset'
// if(args.length < 2){
// 	throw Error('input and output must be defined')
// }
// for(let arg of args){
// 	if(!arg.includes('=')){
// 		throw Error('input and output must be defined')
// 	}
// 	const keyvalue = arg.split('=');
// 	if(keyvalue.length !== 2){
// 		throw Error('input and output format should be key=value')
// 	}
// 	if(keyvalue[0] === 'input'){
// 		input = keyvalue[1];
// 		if(input.lastIndexOf('/') == -1) input+='/';
// 	}
// 	if(keyvalue[0] === 'output'){
// 		output = keyvalue[1];
// 		if(output.lastIndexOf('/') == -1) output+='/';
// 	}
// 	if(keyvalue[0] === 'filename'){
// 		filename = keyvalue[1];
// 		if(filename.lastIndexOf('.json') == -1) filename+='.json';
// 	}

// }

class TreeNode {
	transform:any;
	box?:number[];
	type?:string;
	url?:string;
	children?:TreeNode[];
	computedTransform:any;
	boundingSphere:any;
	leaf?:boolean;
	level?:number;
	ids?:{
		assembly:string,
		element:string,
		category:string
	}
}

/**
 * 外层递归json
 * @param  {array} tree   结果集
 * @param  {string} url    	json地址
 * @param  {object} parent 父级
 */
const getJSONTree = (tree:any[], url:string, parent?:any, _transform?:any)=>{
	
	//文件转json
	let tile = readFile(input+url);
	console.log(tile, 'tile')
	let treeNode = new TreeNode();
	let transform = _transform && _transform.split(',') || tile.root.transform;
	treeNode.transform =  transform && Matrix4.unpack(transform) ||  Matrix4.clone(Matrix4.IDENTITY);
	treeNode.type = !!parent && 'e-root' || 'root';
	treeNode.box = tile.root.content && tile.root.content.boundingVolume && tile.root.content.boundingVolume.box || tile.root.boundingVolume.box;
	treeNode.url = tile.root.content && tile.root.content.url && tile.root.content.url || '';
	treeNode.children = [];
	var parentTransform = parent ? parent.computedTransform : Matrix4.IDENTITY;
	treeNode.computedTransform = Matrix4.multiply(parentTransform, treeNode.transform, new Matrix4());
	treeNode.boundingSphere = createBox((treeNode.box as any[]), treeNode.computedTransform);

	treeNode.leaf = false;
	if(!tile.root.children || !tile.root.children.length){
		treeNode.leaf = true;
	}
	treeNode.level = level;
	if(!!treeNode.url && !(treeNode.url as any).includes('.json')){
		let ids = getB3DMData(input+treeNode.url);
		treeNode.ids = ids;
	}
	
	
	/**
	 * 内层递归子级
	 * @param  {object} parent             父节点
	 * @param  {array} parentNodeChildren 父节点的子级数组
	 * @param  {array} nodes              需要递归的节点树
	 */
	const loop = (parent:TreeNode, parentNodeChildren:TreeNode[], nodes:any[])=>nodes.map(item=>{
		let node = new TreeNode();
		node.box = item.content.boundingVolume && item.content.boundingVolume.box || item.boundingVolume.box;
		node.children = [];
		node.url = item.content.url || item.content.uri || '';
		node.level = level;
		node.type = 'node';
		node.leaf = false;

		node.transform = Matrix4.clone(Matrix4.IDENTITY);

        var parentTransform = parent ? parent.computedTransform : Matrix4.clone(Matrix4.IDENTITY);
        node.computedTransform = Matrix4.multiply(parentTransform, node.transform, new Matrix4());
        node.boundingSphere = createBox((node.box as any[]), node.computedTransform);


		//读取外部json
		if(node.url && (node.url as any).includes('.json')){
			level++;
			getJSONTree(node.children, (node.url as any), node);
			level--;
		}

		//读取b3dm,cmpt数据
		if(!(node.url as any).includes('.json')){
			let ids = getB3DMData(input+node.url);
			node.ids = ids;
		}
		
		//遍历子级
		if(item.children && item.children.length){
			level++;
			loop(node, node.children, item.children);
			level--;
		}else{

			//叶子节点为最终需要使用的位置数据
			node.leaf = true;
		}
		parentNodeChildren.push(node);
	});
		
	
	loop(treeNode, treeNode.children, tile.root.children || []);
	tree.push(treeNode);
}

// const dirs = fs.readdirSync(input);



/**
 * 读取
 * @type {[type]}
 */
export const start = (_input:string, _output:string, _filename:string='tileset.json', _outputFilename:string='tree.json', _transform:string)=>{
	if(!_input || !_output || !_filename) return '路径不存在';
	input = _input, output = _output, filename = _filename;
	(global.win as any).webContents.send('reader-start');
	try{
		getJSONTree(tree, filename, '', _transform);
		if(!/.*(\.json)$/gim.test(_outputFilename)) _outputFilename+='.json';

		let str = global.JSON.stringify(tree, null, "\t");
		fs.writeFileSync(output+_outputFilename, str);
		input ='', output='', filename ='', tree.length=0;
		(global.win as any).webContents.send('reader-success');
	}catch(e){
		(global.win as any).webContents.send('reader-error', e);
	}
	
	
}




