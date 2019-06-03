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
        filename:'Model_1c',
        outputFilename:'model',
    }

    //选择
    async openDialog(type:string){
        let files = await remote.dialog.showOpenDialog({
            title: '选择输入文件夹',
            properties: [ 'openDirectory'],
            defaultPath: '/Users/<username>/Documents/',
            buttonLabel: "选择"
        });
        if(files && files.length){
            if(this.state.input && type=='input' && this.state.output == files[0]){
                return this.props.dispatch({type:'global/setToast', params:{msg:'输入与输出文件夹不能相同'}});
            }
            if(this.state.output && type=='output' && this.state.input == files[0]){
                return this.props.dispatch({type:'global/setToast', params:{msg:'输入与输出文件夹不能相同'}});
            }
            type === 'input' && this.setState({input:files[0]});    
            type === 'output' && this.setState({output:files[0]});    
        }
    }

    startReader(){
        const { reader } = remote.getGlobal('services');
        console.log(reader, 'dddddddddddddd')
        const { input, output, filename, outputFilename } = this.state;
        reader.start(input, output, filename, outputFilename);
    }
    componentWillMount(){
        ipcRenderer.on('reader-start', ()=>{
            this.props.dispatch({type:'global/setLoading', params:{isLoading:true}});
        });
        ipcRenderer.on('reader-finish', ()=>{
            this.props.dispatch({type:'global/setLoading', params:{isLoading:false}});
        });

    }
    onChange(e:any, type:string){
        if(type=='filename'){
            this.setState({filename:e.target.value});
        }else{
            this.setState({outputFilename:e.target.value});
        }
    }
    render(){
        const { input, output, filename, outputFilename } = this.state;
        return (
            <div className={style["home"]}>
                <div className={style.list}>
                    <ul>
                        <li><span className={style['span']}>输出文件名称：</span><Input title={filename} value={filename} placeholder="输出文件名"/></li>
                        <li><span className={style['span']}>输入文件名称：</span><Input title={outputFilename} value={outputFilename} placeholder="输入文件名"/></li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输入文件夹：</span>
                            <Input disabled title={input} value={input} placeholder="输入文件夹"/>
                            <Button onClick={this.openDialog.bind(this, 'input')}>浏览</Button>
                        </li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输出文件夹：</span>
                            <Input disabled title={output} value={output} placeholder="输出文件夹"/>
                            <Button onClick={this.openDialog.bind(this, 'output')}>浏览</Button>
                        </li>
                    </ul>
                    <Button onClick={this.startReader.bind(this)} style={{width:300}} disabled={!input || !output || !filename || !outputFilename } type="primary">开始</Button>
                </div>
            </div>
        )
    }
}

