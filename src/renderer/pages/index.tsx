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
        isSelectDisabled:false,
        // transform:'1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1',
        transform:'',
        appDataFilename:''
    }

    //选择
    async openDialog(type:string){

        let files = await remote.dialog.showOpenDialog({
            title: type == 'input' ? '选择根文件' : '选择输出文件夹',
            properties: (type == 'input' || type == 'appDataFilename') ? ['openFile'] : ['openDirectory'],
            defaultPath: '/Users/<username>/Documents/',
            filters:(type == 'input' || type == 'appDataFilename') ? [{name: 'json', extensions:['json']}] : [],
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
            }else if(type === 'appDataFilename'){
                this.setState({appDataFilename:files[0]}); 
            }
        }
    }

    startReader(){
        const { reader } = remote.getGlobal('services');
        const { input, output, filename, outputFilename, transform, appDataFilename } = this.state;
        const treg = /^$|(((\-?\d+(\.\d+)?)\,){15}(\-?\d+(\.\d+)?)$)/gi
        if(!treg.test(transform)){
            return this.props.dispatch({type:'global/setToast', params:{msg:'变换矩阵格式错误'}});
        }
        if(!input || !output || !filename || !outputFilename){
            return this.props.dispatch({type:'global/setToast', params:{msg:'有未填选项'}});
        }
        reader.start(input, output, appDataFilename, transform, filename, outputFilename);
    }
    componentDidMount(){
        setTimeout(()=>{
            ipcRenderer.on('reader-start', ()=>{
                this.props.dispatch({type:'global/setLoading', params:{isLoading:true}});
            });
            ipcRenderer.on('reader-success', ()=>{
                this.props.dispatch({type:'global/setLoading', params:{isLoading:false}});
                this.props.dispatch({type:'global/setToast', params:{msg:'读取成功'}});
                this.setState({input:'', output:'', path:'', filename:''});
            });

            ipcRenderer.on('reader-error', (e:any)=>{
                this.props.dispatch({type:'global/setLoading', params:{isLoading:false}});
                this.props.dispatch({type:'global/setToast', params:{msg:'读取出错'}});
            });
        },1000);
    }
    onChange(e:any){
        this.setState({outputFilename:e.target.value});
    }
    onTransformChange(e:any){
        let transform = e.target.value || '';
        this.setState({transform});
    }
    render(){
        const { input, output, filename, outputFilename, path, transform, appDataFilename } = this.state;
        const treg = /^$|(((\-?\d+(\.\d+)?)\,){15}(\-?\d+(\.\d+)?)$)/gim;
        return (
            <div className={style["home"]}>
                <div className={style.list}>
                    <ul>
                        <li>
                            <span className={style['span']}>产出文件名称：</span>
                            <Input title={outputFilename} style={{borderColor:!outputFilename ? 'red' : ''}} onChange={this.onChange.bind(this)} value={outputFilename} placeholder="输入文件名"/>
                        </li>
                        <li>
                            <span className={style['span']}>变换矩阵：</span>
                            <Input title={transform} style={{borderColor:!treg.test(transform) ? 'red' : ''}} onChange={this.onTransformChange.bind(this)} value={transform} placeholder="1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1"/>
                        </li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输入根文件：</span>
                            <Input disabled title={input} value={path} placeholder="选择输入根文件"/>
                            <Button onClick={this.openDialog.bind(this, 'input')}>浏览</Button>
                        </li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>appData文件：</span>
                            <Input disabled title={appDataFilename} value={appDataFilename} placeholder="选择appData文件"/>
                            <Button onClick={this.openDialog.bind(this, 'appDataFilename')}>浏览</Button>
                        </li>
                        <li className={style['s-width']}>
                            <span className={style['span']}>输出文件夹：</span>
                            <Input disabled title={output} value={output} placeholder="选择输出文件夹"/>
                            <Button onClick={this.openDialog.bind(this, 'output')}>浏览</Button>
                        </li>
                    </ul>
                    <Button onClick={this.startReader.bind(this)} style={{width:300}} disabled={!path  || !outputFilename || !output} type="primary">开始</Button>
                </div>
            </div>
        )
    }
}

