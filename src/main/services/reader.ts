import { readFile, textDecoder, toArrayBuffer, createBox } from "../utils";
import { Matrix4, Cartesian3, Matrix3, TileOrientedBoundingBox } from 'cesium';
import { ipcMain } from 'electron';
import { any } from 'prop-types';

const fs = require("fs");
let tree:any[] = [];
let level = 0;
let transform = null;

// const args = process.argv.slice(2);
let input = '';
let output = '';
let filename = 'tileset';
let formatChecked = false;
let center:{[key:string]:any} = {
	id:null,
	transform:null,
	origin:null
};
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
	properties?:any
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
		let properties = getB3DMData(input+treeNode.url, formatChecked, treeNode.transform);
		treeNode.properties = properties;
	}


	/**
	 * 内层递归子级
	 * @param  {object} parent             父节点
	 * @param  {array} parentNodeChildren 父节点的子级数组
	 * @param  {array} nodes              需要递归的节点树
	 */
	const loop = (parent:TreeNode, parentNodeChildren:TreeNode[], nodes:any[])=>nodes.map(item=>{
		let node = new TreeNode();
		node.box = item.content && item.content.boundingVolume && item.content.boundingVolume.box || item.boundingVolume.box;
		node.children = [];
		node.url = item.content && (item.content.url || item.content.uri) || '';
		node.level = ++parent.level!;
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
			let properties = getB3DMData(input+node.url, formatChecked, node.computedTransform);
			node.properties = properties;
		}

		//遍历子级
		if(item.children && item.children.length){
			loop(node, node.children, item.children);
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

//清除多余属性
const clearLoop = (tree:any)=>tree.forEach((item:any)=>{
	item.transform && delete item.transform;
	item.box && delete item.box;
	item.url && delete item.url;
	item.computedTransform && delete item.computedTransform;
	if(item.children && item.children.length){
		clearLoop(item.children);
	}
});

class FinalData {
	categories?:any[];
	tileTree?:any[];
	center?:any;
	constructor(categories?:any[], tileTree?:any[]){
		this.categories = categories;
		this.tileTree = tileTree;
	};
}
//读取b3dm数据
export const getB3DMData = (url:string, formatChecked:boolean, transform:any)=>{
	if(!url.includes('.b3dm') && !url.includes('.cmpt')) return;


	let b3dmBuffer = fs.readFileSync(url);
	let ab = toArrayBuffer(b3dmBuffer);
	let dataView = new DataView(ab);
	let featureTableJSONByteLength = dataView.getUint32(12, true);
	let batchTableJsonByteLength = dataView.getUint32(20, true);
	let byteOffset = 28;


	let uint8Array = new Uint8Array(b3dmBuffer);


	// let uint8Array1 = uint8Array.subarray(byteOffset, byteOffset + featureTableJSONByteLength);
	let uint8Array2 = uint8Array.subarray(byteOffset+featureTableJSONByteLength, byteOffset+featureTableJSONByteLength + batchTableJsonByteLength);
	// let jsonText = textDecoder(uint8Array1);
	let jsonText2 = textDecoder(uint8Array2);
	if(jsonText2.length == 1){
		return {}
	}
	let parsejson:any;
	let objReg = /^(\s*{).*(}\s*)$/;

	if (Object.prototype.toString.call(parsejson) !== "[object Object]" && objReg.test(jsonText2)){
		parsejson = JSON.parse(jsonText2);
		if(formatChecked){
			for(let key in parsejson){
				if(Object.prototype.toString.call(parsejson) !== "[object Object]" && objReg.test(parsejson[key])){
					parsejson[key] = JSON.parse(parsejson[key]);

				}
				if(Object.prototype.toString.call(parsejson[key]) === "[object Array]"){
					for(let i =0; i<parsejson[key].length; i++){
						if (Object.prototype.toString.call(parsejson[key][i]) !== "[object Object]" && objReg.test(parsejson[key][i])){
							parsejson[key][i] = JSON.parse(parsejson[key][i]);
							if(key === 'attribute'){
								for(let akey in parsejson[key][i]){
									const geo = parsejson[key][i][akey];
									const low = geo["Range Low"];
									const high = geo["Range High"];
									const low3 = Cartesian3.fromArray(low.split(','));
									const high3 = Cartesian3.fromArray(high.split(','));
									const mid = Cartesian3.midpoint(low3, high3, new Cartesian3());
									if(!!center.id){
										if(Cartesian3.magnitude(mid) < Cartesian3.magnitude(Cartesian3.fromArray(center.origin))){
											center.id = geo['Element ID'];
											center.transform = Matrix4.toArray(transform);
											center.origin = [mid.x, mid.y, mid.z];
										}
									}else{
										center.id = geo['Element ID'];
										center.transform = Matrix4.toArray(transform);
										center.origin = [mid.x, mid.y, mid.z];
									};
								}
							}
						}
					}
				}
			}
		}

		return parsejson;
	}else{
		return jsonText2;
	}
}

/**
 * 读取
 * @type {[type]}
 */
export const start = (_input:string, _output:string, _formatChecked:boolean, _transform:string, _filename='tileset.json', _outputFilename='tree.json' )=>{
	if(!_input || !_output || !_filename) return '路径不存在';
	input = _input, output = _output, filename = _filename;
	formatChecked = _formatChecked;
	(global.win as any).webContents.send('reader-start');
	try{
		let finalData = new FinalData();
		getJSONTree(tree, filename, '', _transform);
		if(!/.*(\.json)$/gim.test(_outputFilename)) _outputFilename+='.json';

		clearLoop(tree);

		finalData.tileTree = tree;
		finalData.center = center;
		// finalData.categories = categories;
		let str = global.JSON.stringify(finalData, null, "\t");
		fs.writeFileSync(output+_outputFilename, str);
		input ='', output='', filename ='', tree.length=0;
		(global.win as any).webContents.send('reader-success');
	}catch(e){
		(global.win as any).webContents.send('reader-error', e);
	}

}




