/**
 * title: Cecsium3DTileReader
 * routerName: home
 */
import React from 'react';
import Base from '@/components/Base';

import $$ from '../utils';
import { connect } from 'dva';
import { router } from 'umi';
import style from './style.less';
import { Input, Button } from 'antd';
import { remote, ipcRenderer } from 'electron';


interface IProps{
	articleList:any[],
    pageIndex:number,
    pageSize:number,
    isMore:boolean,
    isMobile:boolean,
    categoryArticleGroup:any[],
    tagArticleGroup:any[],
    dispatch:Function,
    global:any
}

@connect(({home, global}:any)=>({...home, global}))
export default class Home extends Base<IProps, {}> {
    readonly state = {
        input:'',
        output:'',
        path:'',
        filename:'',
        outputFilename:'model',
    }

    //选择
    async openDialog(type:string){
        let files = await remote.dialog.showOpenDialog({
            title: type == 'input' ? '选择根文件' : '选择输出文件夹',
            properties: type == 'input' ? ['openFile'] : ['openDirectory'],
            defaultPath: '/Users/<username>/Documents/',
            filters:type == 'input' ? [{name: 'json', extensions:['json']}] : [],
            buttonLabel: "选择"
        });
        if(files && files.length){
            files[0] = files[0].replace(/\\/g, '\/');
            if(type=='input'){
                let path = files[0];

                let input = path.substring(0, path.lastIndexOf('/')+1);
                let filename = path.slice( path.lastIndexOf('/')+1)
                this.setState({path, input, filename});
            }else if(type === 'output'){
                this.setState({output:files[0]+'/'}); 
            }
        }
    }

    startReader(){
        const { reader } = remote.getGlobal('services');
        const { input, output, filename, outputFilename } = this.state;
        console.log(input, output, filename, outputFilename, 'asdfasdf')
        reader.start(input, output, filename, outputFilename);
    }
    componentDidMount(){
        setTimeout(()=>{
            ipcRenderer.on('reader-start', ()=>{
                this.props.dispatch({type:'global/setLoading', params:{isLoading:true}});
            });
            ipcRenderer.on('reader-finish', ()=>{
                this.props.dispatch({type:'global/setLoading', params:{isLoading:false}});
                this.setState({input:'', output:'', path:'', filename:'', outputFilename:''});
            });
        },500)
        
    }
    onChange(e:any){
        this.setState({outputFilename:e.target.value});
    }
    render(){
        const { input, output, filename, outputFilename, path } = this.state;
        return (
            <div className={style["home"]}>
                <div className={style.list}>
                    <ul>
                        <li><span className={style['span']}>产出文件名称：</span><Input title={outputFilename} onChange={this.onChange.bind(this)} value={outputFilename} placeholder="输入文件名"/></li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输入根文件：</span>
                            <Input disabled title={input} value={path} placeholder="选择输入根文件"/>
                            <Button onClick={this.openDialog.bind(this, 'input')}>浏览</Button>
                        </li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输出文件夹：</span>
                            <Input disabled title={output} value={output} placeholder="选择输出文件夹"/>
                            <Button onClick={this.openDialog.bind(this, 'output')}>浏览</Button>
                        </li>
                    </ul>
                    <Button onClick={this.startReader.bind(this)} style={{width:300}} disabled={!path  || !outputFilename || !output } type="primary">开始</Button>
                </div>
            </div>
        )
    }
}

