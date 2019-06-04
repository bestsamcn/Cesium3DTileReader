import React from 'react';

export default class Base<P={}, S={}> extends React.Component<P, S>{
	public componentDidMount(){
		window.scrollTo(0, 0);
	}
	public setSyncState(obj:any){
		return new Promise(resolve=>{
			this.setState(obj, resolve);
		});
	}
}