import { ResponseBody } from '@/utils/request';
import $$ from '@/utils';

/**
 * 文章类型
 */
enum ArticleType{
    CATEGORY = 1,
    TAG = 2,
    TOP = 4
}

//排名类型
enum RankType{
	HOT = 1,
	READ = 2,
	LATEST = 3,
	COMMENT = 4
}
export default {
	namespace:'home',
    state: {
        articleList:[],
	    pageIndex:1,
	    pageSize:5,
	    isMore:true,
	    categoryArticleGroup:[],
	    tagArticleGroup:[],
	    hotList:[],
        commentList:[],
        readNumList:[],
        latestList:[],
        tagList:[]
    },
    subscriptions: {
        init({ dispatch, history }:any) {
        },
    },
    effects: {

        //文章列表
        * getArticleList({ params }:{params:any}, { put, call, select }:any) {
        	let { pageIndex, pageSize, articleList } = yield select((state:any)=>state.home);
        	let { isRefresh } = params;
        },

    },
    reducers: {
        setState(state: any, { payload }:any){
            return { ...state, ...payload };
        }
    }
}