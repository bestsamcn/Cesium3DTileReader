import React from 'react';
import {  Loading, Toast,Updator } from '@/components/layouts';
import { connect } from 'dva';
import { withRouter } from 'umi';
import { GlobalModelState } from '@/models/global';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

interface IProps{
	isLogin:boolean,
	isLoading:boolean,
	token:string,
	msg:string,
	iShowMenu:boolean,
	isUpdateAvailable:boolean,
	routes:any[],
	global:any
}

@(withRouter as any)
@connect(({global}:any)=>({...global}))
export default class BaseLayout extends React.Component<IProps, any> {
	readonly state = {
		isResizeToMobile:false,
        routerName:''
	}

	//监听窗口调整
	onresizeWindow(){
        var cw:number = document.documentElement.clientWidth || document.body.clientWidth;
        if(cw >= 768){
            this.setState({isResizeToMobile:false});
        }else{
            this.setState({isResizeToMobile:true});
        }
    }

    //设置路由名称
    setRouterName(name:string){
        this.setState({routerName:name});
    }

    componentWillReceiveProps(nextProps:any) {
    	let { route:{routes} } = nextProps;
        this.setRouterName(routes[0].title);
    }

    componentWillMount(){
        this.onresizeWindow();
    }
	render(){
		const { isLogin, token, msg, iShowMenu, isLoading, isUpdateAvailable } = this.props;

		const { isResizeToMobile, routerName } = this.state;
		return (
	    	<div>
	    		<ReactCSSTransitionGroup 
	    			transitionName={{ enter:'fadeIn', leave:'fadeOut' }} 
	    			transitionEnterTimeout={400} 
	    			transitionLeaveTimeout={700}
	    		>
                    {
                        !!msg && <Toast msg={msg} />
                    }
                </ReactCSSTransitionGroup>
	    		<Loading isLoading={isLoading} />
	    		<div className="router-view">
	                {this.props.children}
	            </div>
	            {isUpdateAvailable && <Updator />}
	    	</div>
	    )
	}
};
