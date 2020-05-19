!function(e){"function"==typeof define&&define.amd?define(e):e()}((function(){"use strict";const e=require("axios"),t=require("lodash"),a=require("moment"),n=require("@wt/lib-flowcontrol"),r=require("pino")({prettyPrint:{levelFirst:!0,translateTime:"SYS:standard",crlf:!0},prettifier:require("pino-pretty")});process.env.LOGGER&&(r.level=process.env.LOGGER);const s="stock_basic",d="stock_company",o="stk_managers",i="daily",c="adj_factor",l="suspend_d",_="daily_basic",u="index_basic",m="index_daily",p="ts_code,symbol,name,area,industry,fullname,enname,market,exchange,curr_type,list_status,list_date,delist_date,is_hs",f="ts_code,exchange,chairman,manager,secretary,reg_capital,setup_date,province,city,introduction,website,email,office,employees,main_business,business_scope",y="ts_code,ann_date,name,gender,lev,title,edu,national,birthday,begin_date,end_date,resume",h="ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",g="ts_code,trade_date,adj_factor",Y="ts_code,trade_date,suspend_timing,suspend_type",E="ts_code,trade_date,close,turnover_rate,turnover_rate_f,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv",w="ts_code,name,fullname,market,publisher,index_type,category,base_date,base_point,list_date,weight_rule,desc,exp_date",b="ts_code,trade_date,close,open,high,low,pre_close,change,pct_chg,vol,amount",S={[i]:{maxFlow:800},[m]:{maxFlow:300},[c]:{maxFlow:800},"默认":{maxFlow:800}};const M=function(){let e={};for(let t in S)Object.prototype.hasOwnProperty.call(S,t)&&(e[t]=new n(S[t].maxFlow,`接口${t}流控`),r.debug(`创建流控 接口${t}, %o`,e[t]));return e}();let D=0,v=0,x=0;async function T(n="",s={},d="",o=null,i=null){if(!n&&""===n)throw new Error("未指定接口api名称！");r.debug("%s 发送请求，%s, %o",a().format("h:mm:ss"),n,s),D++;let c=M[n];c||(c=M["默认"]);const l=await c.call(e.post,"http://api.tushare.pro",{api_name:n,token:process.env.TUSHARE_TOKEN,params:s,fields:d});if(v++,l&&l.data&&0===l.data.code){let e=l.data.data.fields,a=l.data.data.items,d=l.data.data.has_more;r.debug("收到服务器响应：字段数量=%d, 数据长度=%d，是否还有更多数据：%s；请求信息 %s，%o",e.length,a.length,d,n,s);let c=await async function(e){if(!e)return e;let t=e.fields,a=e.items,n=[];if(!t||0===t.length||!a||0===a.length)return n;for(let e=0;e<a.length;e++){let r={};for(let n=0;n<t.length;n++)r[t[n]]=a[e][n];n.push(r)}return n}({fields:e,items:a});if(d&&o&&t.isFunction(o)){let a=await o(s,c);if(r.debug("有更多数据需要获取：%o, %o, %d",s,a,c&&c.length),a){let s=await T(n,a,e,o,i);d=s&&s.hasMore;let l=s&&s.data;i&&t.isFunction(i)?(r.debug("更多数据调用合并: %d && %d",c.length,l.length),c=await i(c,l&&l.data)):(r.debug("更多数据自动合并: %d && %d",c.length,l.length),c.push(...l))}else d=!1}return{data:c,hasMore:d}}throw x++,r.error("发现错误(请求信息 %s, %o)：%s, %s",n,s,l.data.code,l.data.msg),new Error("接口返回错误["+l.data.code+"]:"+l.data.msg)}module.exports={stockBasic:async function(e="",t="L"){let a=await T(s,{exchange:e,list_status:t},p);return a&&a.data},stockCompany:async function(e,a){if(t.isEmpty(e))return new Error("公司基本信息未指定代码");if(t.isEmpty(a))return new Error("公司基本信息未指定交易所");let n=await T(d,{ts_code:e,exchange:a},f);return n&&n.data},stockManagers:async function(e="",a="",n,r){if(t.isEmpty(e)&&t.isEmpty(a)&&t.isEmpty(n)&&t.isEmpty(r))return new Error("上市公司管理层参数设置错误！");let s=await T(o,{ts_code:e,ann_date:a,start_date:n,end_date:r},y);return s&&s.data},stockDaily:async function(e,n="",s=""){if(t.isEmpty(e))return new Error("日线行情数据代码设置错误！");t.isEmpty(n)&&(n="19901101"),t.isEmpty(s)&&(s=a().format("YYYYMMDD"));let d=await T(i,{ts_code:e,start_date:n,end_date:s},h,async(t,r)=>{if(r&&r.length>0){let t=a(r[r.length-1].trade_date,"YYYYMMDD");return{ts_code:e,start_date:n,end_date:t.subtract(1,"days").format("YYYYMMDD")}}return null});return r.debug(`获得日线数据 ${e}, 条数=${d&&d.data&&d.data.length}`),d&&d.data},adjustFactor:async function(e,n="",r=""){if(t.isEmpty(e))return new Error("读取复权因子需要设置股票代码");t.isEmpty(n)&&(n="19901101"),t.isEmpty(r)&&(r=a().format("YYYYMMDD"));let s=await T(c,{ts_code:e,start_date:n,end_date:r},g,async(t,r)=>{if(r&&r.length>0){let t=a(r[r.length-1].trade_date,"YYYYMMDD");return{ts_code:e,start_date:n,end_date:t.subtract(1,"days").format("YYYYMMDD")}}return null});return s&&s.data},suspendList:async function(e){t.isEmpty(e)&&(e=a().format("YYYYMMDD"));let n=await T(l,{trade_date:e},Y);return n&&n.data},dailyBasicList:async function(e=null){t.isEmpty(e)&&(e=a().format("YYYYMMDD"));let n=await T(_,{trade_date:e},E);return n&&n.data},dailyBasic:async function(e,a=null,n=null){if(t.isEmpty(e))return new Error(_+"需要设置查询的股票代码");let r=await T(_,{ts_code:e,start_date:a,end_date:n},E);return r&&r.data},indexBasic:async function(e){if(t.isEmpty(e))return new Error("获取指数信息列表需要设置市场或服务商");let a=await T(u,{market:e},w);return a&&a.data},indexDaily:async function(e,n="",s=""){if(t.isEmpty(e))return new Error("指数日线数据代码设置错误！");t.isEmpty(n)&&(n="19901101"),t.isEmpty(s)&&(s=a().format("YYYYMMDD"));let d=await T(m,{ts_code:e,start_date:n,end_date:s},b,async(t,r)=>{let s="";if(r&&r.length>0){return s=a(r[r.length-1].trade_date,"YYYYMMDD").subtract(1,"days").format("YYYYMMDD"),{ts_code:e,start_date:n,end_date:s}}return null});return r.debug(`获得指数日线数据 ${e}, 条数=${d&&d.data&&d.data.length}`),d&&d.data},globalIndexList:[{code:"XIN9",name:"富时中国A50指数 (富时A50)"},{code:"HSI",name:"恒生指数"},{code:"DJI",name:"道琼斯工业指数"},{code:"SPX",name:"标普500指数"},{code:"IXIC",name:"纳斯达克指数"},{code:"FTSE",name:"富时100指数"},{code:"FCHI",name:"法国CAC40指数"},{code:"GDAXI",name:"德国DAX指数"},{code:"N225",name:"日经225指数"},{code:"KS11",name:"韩国综合指数"},{code:"AS51",name:"澳大利亚标普200指数"},{code:"SENSEX",name:"印度孟买SENSEX指数"},{code:"IBOVESPA",name:"巴西IBOVESPA指数"},{code:"RTS",name:"俄罗斯RTS指数"},{code:"TWII",name:"台湾加权指数"},{code:"SPTSX",name:"加拿大S&P/TSX指数"}],indexMarketList:[{code:"CSI",name:"中证指数"},{code:"SSE",name:"上交所指数"},{code:"SZSE",name:"深交所指数"}],fieldNames:{is_hs:"是否沪深港通标的，N否 H沪股通 S深股通",list_status:"上市状态： L上市 D退市 P暂停上市",exchange:"交易所代码 SSE上交所 SZSE深交所 HKEX港交所(未上线)",ts_code:"TS代码",symbol:"股票代码",name:"股票名称",area:"所在地域",industry:"所属行业",fullname:"股票全称",enname:"英文全称",market:"市场类型 （主板/中小板/创业板/科创板）",curr_type:"交易货币",list_date:"上市日期",delist_date:"退市日期",start_date:"开始日期",end_date:"结束日期",is_open:"是否交易 0 休市 1交易",ann_date:"公告日期（YYYYMMDD格式）",change_reason:"变更原因",chairman:"法人代表",manager:"总经理",secretary:"董秘",reg_capital:"注册资本",setup_date:"注册日期",province:"所在省份",city:"所在城市",introduction:"公司介绍",website:"公司主页",email:"电子邮件",office:"办公室",employees:"员工人数",main_business:"主要业务及产品",business_scope:"经营范围",gender:"性别",lev:"岗位类别",title:"岗位",edu:"学历",national:"国籍",birthday:"出生年月",begin_date:"上任日期",resume:"个人简历",trade_date:"交易日期",open:"开盘价",high:"最高价",low:"最低价",close:"收盘价",pre_close:"昨收价",change:"涨跌额",pct_chg:"涨跌幅 （未复权）",vol:"成交量 （手）",amount:"成交额 （千元）",adj_factor:"复权因子",suspend_type:"停复牌类型：S-停牌,R-复牌",suspend_timing:"日内停牌时间段",turnover_rate:"换手率（%）",turnover_rate_f:"换手率（自由流通股）",volume_ratio:"量比",pe:"市盈率（总市值/净利润， 亏损的PE为空）",pe_ttm:"市盈率（TTM，亏损的PE为空）",pb:"市净率（总市值/净资产）",ps:"市销率",ps_ttm:"市销率（TTM）",dv_ratio:"股息率 （%）",dv_ttm:"股息率（TTM）（%）",total_share:"总股本 （万股）",float_share:"流通股本 （万股）",free_share:"自由流通股本 （万）",total_mv:"总市值 （万元）",circ_mv:"流通市值（万元）"},showInfo:function(){return`共发送请求${D}个，收到${v}个返回，其中${x}个错误`}}}));
//# sourceMappingURL=tushare.js.map