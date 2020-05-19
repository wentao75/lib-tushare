/* eslint-disable camelcase */
const axios = require("axios");
const _ = require("lodash");
const moment = require("moment");
const FlowControl = require("@wt/lib-flowcontrol");
const pino = require("pino");

const logger = pino({
    level: process.env.LOGGER || "info",
    prettyPrint: {
        levelFirst: true,
        translateTime: "SYS:yyyy-yy-dd HH:MM:ss.l",
        crlf: true,
    },
    prettifier: require("pino-pretty"),
});

// const token = ""
const tushareUrl = "http://api.tushare.pro";
// 增加一个 fieldNames用来给出每个字段（包括输入/输出的说明）
const fieldNames = {
    is_hs: "是否沪深港通标的，N否 H沪股通 S深股通",
    list_status: "上市状态： L上市 D退市 P暂停上市",
    exchange: "交易所代码 SSE上交所 SZSE深交所 HKEX港交所(未上线)",
    ts_code: "TS代码",
    symbol: "股票代码",
    name: "股票名称",
    area: "所在地域",
    industry: "所属行业",
    fullname: "股票全称",
    enname: "英文全称",
    market: "市场类型 （主板/中小板/创业板/科创板）",
    curr_type: "交易货币",
    list_date: "上市日期",
    delist_date: "退市日期",
    start_date: "开始日期",
    end_date: "结束日期",
    is_open: "是否交易 0 休市 1交易",
    ann_date: "公告日期（YYYYMMDD格式）",
    change_reason: "变更原因",

    chairman: "法人代表",
    manager: "总经理",
    secretary: "董秘",
    reg_capital: "注册资本",
    setup_date: "注册日期",
    province: "所在省份",
    city: "所在城市",
    introduction: "公司介绍",
    website: "公司主页",
    email: "电子邮件",
    office: "办公室",
    employees: "员工人数",
    main_business: "主要业务及产品",
    business_scope: "经营范围",
    gender: "性别",
    lev: "岗位类别",
    title: "岗位",
    edu: "学历",
    national: "国籍",
    birthday: "出生年月",
    begin_date: "上任日期",
    // end_date: '离任日期',
    resume: "个人简历",
    trade_date: "交易日期",
    open: "开盘价",
    high: "最高价",
    low: "最低价",
    close: "收盘价",
    pre_close: "昨收价",
    change: "涨跌额",
    pct_chg: "涨跌幅 （未复权）",
    vol: "成交量 （手）",
    amount: "成交额 （千元）",
    adj_factor: "复权因子",
    suspend_type: "停复牌类型：S-停牌,R-复牌",
    suspend_timing: "日内停牌时间段",
    turnover_rate: "换手率（%）",
    turnover_rate_f: "换手率（自由流通股）",
    volume_ratio: "量比",
    pe: "市盈率（总市值/净利润， 亏损的PE为空）",
    pe_ttm: "市盈率（TTM，亏损的PE为空）",
    pb: "市净率（总市值/净资产）",
    ps: "市销率",
    ps_ttm: "市销率（TTM）",
    dv_ratio: "股息率 （%）",
    dv_ttm: "股息率（TTM）（%）",
    total_share: "总股本 （万股）",
    float_share: "流通股本 （万股）",
    free_share: "自由流通股本 （万）",
    total_mv: "总市值 （万元）",
    circ_mv: "流通市值（万元）",
};
const globalIndexList = [
    { code: "XIN9", name: "富时中国A50指数 (富时A50)" },
    { code: "HSI", name: "恒生指数" },
    { code: "DJI", name: "道琼斯工业指数" },
    { code: "SPX", name: "标普500指数" },
    { code: "IXIC", name: "纳斯达克指数" },
    { code: "FTSE", name: "富时100指数" },
    { code: "FCHI", name: "法国CAC40指数" },
    { code: "GDAXI", name: "德国DAX指数" },
    { code: "N225", name: "日经225指数" },
    { code: "KS11", name: "韩国综合指数" },
    { code: "AS51", name: "澳大利亚标普200指数" },
    { code: "SENSEX", name: "印度孟买SENSEX指数" },
    { code: "IBOVESPA", name: "巴西IBOVESPA指数" },
    { code: "RTS", name: "俄罗斯RTS指数" },
    { code: "TWII", name: "台湾加权指数" },
    { code: "SPTSX", name: "加拿大S&P/TSX指数" },
];
const indexMarketList = [
    // {code: "MSCI", name: "MSCI指数"},
    { code: "CSI", name: "中证指数" },
    { code: "SSE", name: "上交所指数" },
    { code: "SZSE", name: "深交所指数" },
    // {code: "CICC", name: "中金指数"},
    // {code: "SW", name: "申万指数"},
    // {code: "OTH", name: "其他指数"},
];

const apiNames = {
    stockBasic: "stock_basic",
    stockCompany: "stock_company",
    stockManagers: "stk_managers",
    stockRewards: "stk_rewards",
    newShare: "new_share",
    // 接口：daily，日线行情
    // 数据说明：交易日每天15点～16点之间。本接口是未复权行情，停牌期间不提供数据。
    // 描述：获取股票行情数据，或通过通用行情接口获取数据，包含了前后复权数据。
    daily: "daily",
    // 接口：adj_factor
    // 更新时间：早上9点30分
    // 描述：获取股票复权因子，可提取单只股票全部历史复权因子，也可以提取单日全部股票的复权因子。
    adjustFactor: "adj_factor",
    // 接口：suspend_d
    // 更新时间：不定期
    // 描述：按日期方式获取股票每日停复牌信息
    suspendInfo: "suspend_d",
    // 接口：daily_basic
    // 更新时间：交易日每日15点～17点之间
    // 描述：获取全部股票每日重要的基本面指标，可用于选股分析、报表展示等。
    dailyBasic: "daily_basic",
    // 接口：moneyflow
    // 描述：获取沪深A股票资金流向数据，分析大单小单成交情况，用于判别资金动向
    moneyFlow: "moneyflow",
    // 接口：limit_list
    // 描述：获取每日涨跌停股票统计，包括封闭时间和打开次数等数据，帮助用户快速定位近期强（弱）势股，以及研究超短线策略。
    limitList: "limit_list",
    // 接口：moneyflow_hsgt
    // 描述：获取沪股通、深股通、港股通每日资金流向数据，每次最多返回300条记录，总量不限制。
    moneyFlowHSGT: "moneyflow_hsgt",
    // 接口：hsgt_top10
    // 描述：获取沪股通、深股通每日前十大成交详细数据
    hsgtTop10: "hsgt_top10",
    // 接口：hk_hold
    // 描述：获取沪深港股通持股明细，数据来源港交所。
    hkHold: "hk_hold",
    // 接口：ggt_daily
    // 描述：获取港股通每日成交信息，数据从2014年开始
    ggtDaily: "ggt_daily",
    // 接口：ggt_monthly
    // 描述：港股通每月成交信息，数据从2014年开始
    ggtMonthly: "ggt_monthly",
    // 接口：index_global
    // 描述：获取国际主要指数日线行情
    indexGlobal: "index_global",
    // 接口：income
    // 描述：获取上市公司财务利润表数据
    income: "income",
    // 接口：index_basic
    // 描述：获取指数基础信息。
    indexBasic: "index_basic",
    // 接口：index_daily
    // 描述：获取指数每日行情
    indexDaily: "index_daily",
    // 接口：index_weight
    // 描述：获取各类指数成分和权重，月度数据
    indexWeight: "index_weight",
    // 接口：index_dailybasic
    // 描述：目前只提供上证综指，深证成指，上证50，中证500，中小板指，创业板指的每日指标数据
    indexDailyBasic: "index_dailybasic",
    // 接口：index_classify
    // 描述：获取申万行业分类，包括申万28个一级分类，104个二级分类，227个三级分类的列表信息
    indexClassify: "index_classify",
    // 接口：index_member
    // 描述：申万行业成分
    indexMember: "index_member",
    // 接口：daily_info
    // 描述：获取交易所股票交易统计，包括各板块明细
    dailyInfo: "daily_info",
};

const apiFields = {
    stockBasic:
        "ts_code,symbol,name,area,industry,fullname,enname,market,exchange,curr_type,list_status,list_date,delist_date,is_hs",
    stockCompany:
        "ts_code,exchange,chairman,manager,secretary,reg_capital,setup_date,province,city,introduction,website,email,office,employees,main_business,business_scope",
    stockManagers:
        "ts_code,ann_date,name,gender,lev,title,edu,national,birthday,begin_date,end_date,resume",
    stockRewards: "ts_code,ann_date,end_date,name,title,reward,hold_vol",
    newShare:
        "ts_code,sub_code,name,ipo_date,issue_date,amount,market_amount,price,pe,limit_amount,funds,ballot",
    daily:
        "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
    adjustFactor: "ts_code,trade_date,adj_factor",
    suspendInfo: "ts_code,trade_date,suspend_timing,suspend_type",
    dailyBasic:
        "ts_code,trade_date,close,turnover_rate,turnover_rate_f,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv",
    moneyFlow:
        "ts_code,trade_date,buy_sm_vol,buy_sm_amount,sell_sm_vol,sell_sm_amount,buy_md_vol,buy_md_amount,sell_md_vol,sell_md_amount,buy_lg_vol,buy_lg_amount,sell_lg_vol,sell_lg_amount,buy_elg_vol,buy_elg_amount,sell_elg_vol,sell_elg_amount,net_mf_vol,net_mf_amount",
    limitList:
        "ts_code,trade_date,name,close,pct_chg,amp,fc_ratio,fl_ratio,fd_amount,first_time,last_time,open_times,strth,limit",
    moneyFlowHSGT: "trade_date,ggt_ss,ggt_sz,hgt,sgt,north_money,south_money",
    hsgtTop10:
        "ts_code,trade_date,name,close,change,rank,market_type,amount,net_amount,buy,sell",
    hkHold: "code,trade_date,ts_code,name,vol,ratio,exchange",
    ggtDaily: "trade_date,buy_amount,buy_volume,sell_amount,sell_volume",
    ggtMonthly:
        "month,day_buy_amt,day_buy_vol,day_sell_amt,day_sell_vol,total_buy_amt,total_buy_vol,total_sell_amt,total_sell_vol",
    indexGlobal:
        "ts_code,trade_date,open,close,high,low,pre_close,change,pct_chg,vol,amount",
    income:
        "ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,basic_eps,total_revenue,revenue,int_income,prem_earned,comm_income,n_commis_income,n_oth_income,n_oth_b_income,out_prem,une_prem_reser,reins_income,n_sec_tb_income,n_sec_uw_income,n_asset_mg_income,oth_b_income,fv_value_chg_gain,invest_income,ass_invest_income,forex_gain,total_cogs,oper_cost,int_exp,comm_exp,biz_tax_surchg,sell_exg,admin_exp,fin_exp,assets_impair_loss,prem_refund,compens_payout,reser_insur_liab,div_payt,reins_exp,oper_exp,compens_payout_refu,insur_reser_refu,reins_cost_refund,other_bus_cost,operate_profit,non_oper_income,non_oper_exp,nca_disploss,total_profit_income_tax,n_income,n_income_attr_p,minority_gain,oth_compr_income,t_compr_income,compr_inc_attr_p,compr_inc_attr_m_s,ebit,ebitda,insurance_exp,undist_profit,distable_profit,update_flag",
    indexBasic:
        "ts_code,name,fullname,market,publisher,index_type,category,base_date,base_point,list_date,weight_rule,desc,exp_date",
    indexDaily:
        "ts_code,trade_date,close,open,high,low,pre_close,change,pct_chg,vol,amount",
    indexWeight: "index_code,con_code,trade_date,weight",
    indexDailyBasic:
        "ts_code,trade_date,total_mv,float_mv,total_share,float_share,free_share,turnover_rate,turnover_rate_f,pe,pe_ttm,pb",
    indexClassify: "index_code,industry_name,level,industry_code",
    indexMember:
        "index_code,index_name,con_code,con_name,in_date,out_date,is_new",
    dailyInfo:
        "trade_date,ts_code,ts_name,com_count,total_share,float_share,total_mv,float_mv,amount,vol,trans_count,pe,tr,exchange",
};

// 每个api_name对应一组流控参数，如果没有配置，则认为不需要流控，
// 或者统一放在一个默认流控池中控制
const DEFAULT_FLOWCONTROL_NAME = "默认";
const FLOW_CONFIG = {
    [apiNames.daily]: { maxFlow: 800 },
    [apiNames.indexDaily]: { maxFlow: 300 },
    [apiNames.adjustFactor]: { maxFlow: 800 },
    [apiNames.dailyBasic]: { maxFlow: 400 },
    [DEFAULT_FLOWCONTROL_NAME]: { maxFlow: 800 },
};

// const MAX_WORKER = 20
// const MAX_FLOW = 300
// 流控池，每个协议定义自己的流控
// const flowControl = {
//     daily: new FlowControl(MAX_WORKER, MAX_FLOW, "tushare流控"),
// }

function initFlowControl() {
    let tmp = {};
    for (let api in FLOW_CONFIG) {
        if (Object.prototype.hasOwnProperty.call(FLOW_CONFIG, api)) {
            tmp[api] = new FlowControl(
                FLOW_CONFIG[api].maxFlow,
                `接口${api}流控`
            );
            logger.debug(`创建流控 接口${api}, %o`, tmp[api]);
        }
    }
    return tmp;
}
const flowControls = initFlowControl();

// 请求计数
let requestCount = 0;
let responseCount = 0;
let errorCount = 0;

/**
 *
 * @param {string} api 发起请求的接口名称
 * @param {object} params 接口参数
 * @param {string} fields 返回字段列表，逗号分割字符串
 * @param {Function} hasMoreParams 如果接口返回hasMore，使用该方法计算获取下一次数据的参数，方法传入上一次参数和本次返回数据，不设置则不支持hasMore
 * @param {Function} moreDatas 在支持hasMore后，返回数据和之前数据的合并处理方法，传入之前的数据和这一次返回数据，返回合并结果，不设置则按照数组自动添加在后面
 */
// eslint-disable-next-line max-params
async function queryData(
    api = "",
    params = {},
    fields = "",
    hasMoreParams = null,
    moreDatas = null
) {
    if (!api && api === "") {
        throw new Error("未指定接口api名称！");
    }
    // logger.log("tushare query data:", api, params)
    // logger.log("env: ", process.env)

    // await sleep(1000 / 800)
    // console.count("queryData");
    logger.debug(
        "%s 发送请求，%s, %o",
        moment().format("h:mm:ss"),
        api,
        params
    );
    requestCount++;

    // 流控添加到axios发起时触发，流控池由api_name进行分组
    let fc = flowControls[api];
    if (!fc) {
        fc = flowControls[DEFAULT_FLOWCONTROL_NAME];
    }
    // logger.debug("use flow control: ", api, fc, typeof fc)
    const response = await fc.call(axios.post, tushareUrl, {
        api_name: api,
        token: process.env.TUSHARE_TOKEN,
        params,
        fields: fields,
    });

    // const response = await axios.post(tushareUrl, {
    //     api_name: api,
    //     token: process.env.TUSHARE_TOKEN,
    //     params,
    //     fields: fields,
    // })

    // .then(function (response) {
    // logger.log(response)
    responseCount++;
    if (response && response.data && response.data.code === 0) {
        let fields = response.data.data.fields;
        let items = response.data.data.items;
        let hasMore = response.data.data.has_more;

        logger.debug(
            "收到服务器响应：字段数量=%d, 数据长度=%d，是否还有更多数据：%s；请求信息 %s，%o",
            fields.length,
            items.length,
            hasMore,
            api,
            params
        );
        let data = await constructData({ fields, items });
        // logger.log("constructed data:", data.length)

        // 这里考虑在hasMore为true，并且传入了hasMoreParams方法的情况下执行更多数据获取的逻辑
        if (hasMore && hasMoreParams && _.isFunction(hasMoreParams)) {
            let nextParams = await hasMoreParams(params, data);
            logger.debug(
                "有更多数据需要获取：%o, %o, %d",
                params,
                nextParams,
                data && data.length
            );
            // 如果无法设置参数，会返回空，这里就不再继续获取
            if (nextParams) {
                let moreRetData = await queryData(
                    api,
                    nextParams,
                    fields,
                    hasMoreParams,
                    moreDatas
                );
                hasMore = moreRetData && moreRetData.hasMore;
                let moreData = moreRetData && moreRetData.data;

                if (moreDatas && _.isFunction(moreDatas)) {
                    logger.debug(
                        "更多数据调用合并: %d && %d",
                        data.length,
                        moreData.length
                    );
                    data = await moreDatas(data, moreData && moreData.data);
                } else {
                    logger.debug(
                        "更多数据自动合并: %d && %d",
                        data.length,
                        moreData.length
                    );
                    data.push(...moreData);
                }
            } else {
                hasMore = false;
            }
        }

        return {
            data,
            hasMore,
        };
    }
    errorCount++;
    logger.error(
        "发现错误(请求信息 %s, %o)：%s, %s",
        api,
        params,
        response.data.code,
        response.data.msg
    );
    throw new Error(
        "接口返回错误[" + response.data.code + "]:" + response.data.msg
    );
}

// async function queryDataLimit(api, params, fields) {
//     return flowControl.call(queryData, api, params, fields)
// }

/**
 * 重构接口返回数据
 * @param {Array} data http接口返回数据
 */
async function constructData(data) {
    if (!data) return data;
    let fields = data.fields;
    let items = data.items;
    let tmp = [];
    if (!fields || fields.length === 0 || !items || items.length === 0) {
        return tmp;
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        let tmpItem = {};
        for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
            tmpItem[fields[fieldIndex]] = items[itemIndex][fieldIndex];
        }
        tmp.push(tmpItem);
    }
    return tmp;
}

async function stockBasic(exchange = "", listStatus = "L") {
    let data = await queryData(
        apiNames.stockBasic,
        {
            exchange,
            list_status: listStatus,
        },
        apiFields.stockBasic
    );
    return data && data.data;
}

async function stockCompany(tsCode, exchange) {
    if (_.isEmpty(tsCode)) return new Error("公司基本信息未指定代码");
    if (_.isEmpty(exchange)) return new Error("公司基本信息未指定交易所");

    let data = await queryData(
        apiNames.stockCompany,
        {
            ts_code: tsCode,
            exchange,
        },
        apiFields.stockCompany
    );
    return data && data.data;
}

async function stockManagers(tsCode = "", annDate = "", startDate, endDate) {
    if (
        _.isEmpty(tsCode) &&
        _.isEmpty(annDate) &&
        _.isEmpty(startDate) &&
        _.isEmpty(endDate)
    ) {
        return new Error("上市公司管理层参数设置错误！");
    }

    let data = await queryData(
        apiNames.stockManagers,
        {
            ts_code: tsCode,
            ann_date: annDate,
            start_date: startDate,
            end_date: endDate,
        },
        apiFields.stockManagers
    );
    return data && data.data;
}

/**
 * 这个方法用来读取指定股票代码的历史数据，如果startDate未设置，则需要获取全部
 * 如果startDate未设置，需要读取最新
 * @param {string} tsCode 代码
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 */
async function stockDaily(tsCode, startDate = "", endDate = "") {
    if (_.isEmpty(tsCode)) {
        return new Error("日线行情数据代码设置错误！");
    }

    if (_.isEmpty(startDate)) {
        // 需要设置开始日期
        startDate = "19901101";
    }
    if (_.isEmpty(endDate)) {
        endDate = moment().format("YYYYMMDD");
    }

    let data = await queryData(
        apiNames.daily,
        {
            ts_code: tsCode,
            start_date: startDate,
            end_date: endDate,
        },
        apiFields.daily,
        async (params, retData) => {
            // let endDate = ""
            if (retData && retData.length > 0) {
                let lastDate = moment(
                    retData[retData.length - 1].trade_date,
                    "YYYYMMDD"
                );
                // endDate =
                return {
                    ts_code: tsCode,
                    start_date: startDate,
                    end_date: lastDate.subtract(1, "days").format("YYYYMMDD"),
                };
            }
            return null;
        }
    );
    logger.debug(
        `获得日线数据 ${tsCode}, 条数=${data && data.data && data.data.length}`
    );
    return data && data.data;
    // let hasMore = true
    // let retData = []
    // while (hasMore) {
    //     let data = null
    //     // 计算下一个日期范围
    //     if (retData.length > 0) {
    //         let lastDate = moment(retData[retData.length - 1].trade_date, "YYYYMMDD")
    //         endDate = lastDate.subtract(1, "days").format("YYYYMMDD")
    //     }

    //     logger.debug("stock daily query: ", tsCode, startDate, endDate)

    //     // eslint-disable-next-line no-await-in-loop
    //     let tmp = await queryData(
    //         apiNames.daily,
    //         {
    //             ts_code: tsCode,
    //             start_date: startDate,
    //             end_date: endDate,
    //         },
    //         apiFields.daily
    //     )
    //     hasMore = tmp && tmp.hasMore
    //     data = tmp && tmp.data

    //     if (data && data.length > 0) {
    //         retData.push(...data)
    //     }
    //     logger.debug("stock daily read: ", tsCode, data && data.length, hasMore, retData && retData.length)
    // }
    // return retData
}

/**
 * 这个方法用来读取指定指数代码的历史数据，如果startDate未设置，则需要获取全部
 * 如果startDate未设置，需要读取最新
 * @param {string} tsCode 代码
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 */
async function indexDaily(tsCode, startDate = "", endDate = "") {
    if (_.isEmpty(tsCode)) {
        return new Error("指数日线数据代码设置错误！");
    }

    if (_.isEmpty(startDate)) {
        // 需要设置开始日期
        startDate = "19901101";
    }
    if (_.isEmpty(endDate)) {
        endDate = moment().format("YYYYMMDD");
    }

    let data = await queryData(
        apiNames.indexDaily,
        {
            ts_code: tsCode,
            start_date: startDate,
            end_date: endDate,
        },
        apiFields.indexDaily,
        async (params, retData) => {
            let endDate = "";
            if (retData && retData.length > 0) {
                let lastDate = moment(
                    retData[retData.length - 1].trade_date,
                    "YYYYMMDD"
                );
                endDate = lastDate.subtract(1, "days").format("YYYYMMDD");
                return {
                    ts_code: tsCode,
                    start_date: startDate,
                    end_date: endDate,
                };
            }
            return null;
        }
    );
    logger.debug(
        `获得指数日线数据 ${tsCode}, 条数=${
            data && data.data && data.data.length
        }`
    );
    return data && data.data;
}

/**
 * 提供一只股票指定时间范围的全部复权因子数据，这个数据可以在日线历史数据中配合使用
 * @param {string} tsCode 股票代码
 * @param {string} startDate 读取复权因子的开始日期 YYYYMMDD
 * @param {string} endDate 读取复权因子的结束日期 YYYYMMDD
 */
async function adjustFactor(tsCode, startDate = "", endDate = "") {
    if (_.isEmpty(tsCode)) {
        return new Error("读取复权因子需要设置股票代码");
    }
    if (_.isEmpty(startDate)) {
        // 需要设置开始日期
        startDate = "19901101";
    }
    if (_.isEmpty(endDate)) {
        endDate = moment().format("YYYYMMDD");
    }

    let data = await queryData(
        apiNames.adjustFactor,
        {
            ts_code: tsCode,
            start_date: startDate,
            end_date: endDate,
        },
        apiFields.adjustFactor,
        async (params, retData) => {
            // let endDate = ""
            if (retData && retData.length > 0) {
                let lastDate = moment(
                    retData[retData.length - 1].trade_date,
                    "YYYYMMDD"
                );
                // endDate =
                return {
                    ts_code: tsCode,
                    start_date: startDate,
                    end_date: lastDate.subtract(1, "days").format("YYYYMMDD"),
                };
            }
            return null;
        }
    );
    return data && data.data;
}

/**
 * 获取指定日期的所有停复盘股票信息
 * @param {string} tradeDate 交易日期 YYYYMMDD
 */
async function suspendList(tradeDate) {
    if (_.isEmpty(tradeDate)) {
        tradeDate = moment().format("YYYYMMDD");
    }

    let data = await queryData(
        apiNames.suspendInfo,
        {
            trade_date: tradeDate,
        },
        apiFields.suspendInfo
    );
    return data && data.data;
}

/**
 * 获取指定日期的全部股票的基本面指标，如果日期未设置，则取今日指标
 * @param {string} tradeDate 数据日期
 */
async function dailyBasicList(tradeDate = null) {
    if (_.isEmpty(tradeDate)) {
        tradeDate = moment().format("YYYYMMDD");
    }

    let data = await queryData(
        apiNames.dailyBasic,
        {
            trade_date: tradeDate,
        },
        apiFields.dailyBasic
    );
    return data && data.data;
}

/**
 * 获取指定日期范围股票的全部基本面列表
 * @param {string} tsCode 代码
 * @param {string} startDate 开始日期 YYYYMMDD
 * @param {string} endDate 结束日期 YYYYMMDD
 */
async function dailyBasic(tsCode, startDate = null, endDate = null) {
    if (_.isEmpty(tsCode)) {
        return new Error(apiNames.dailyBasic + "需要设置查询的股票代码");
    }
    let data = await queryData(
        apiNames.dailyBasic,
        {
            ts_code: tsCode,
            start_date: startDate,
            end_date: endDate,
        },
        apiFields.dailyBasic,
        async (params, retData) => {
            // let endDate = ""
            if (retData && retData.length > 0) {
                let lastDate = moment(
                    retData[retData.length - 1].trade_date,
                    "YYYYMMDD"
                );
                // endDate =
                return {
                    ts_code: tsCode,
                    start_date: startDate,
                    end_date: lastDate.subtract(1, "days").format("YYYYMMDD"),
                };
            }
            return null;
        }
    );
    return data && data.data;
}

/**
 * 根据提供的市场/发布商获取指数基础信息列表
 * @param {string} market 市场/发布商
 */
async function indexBasic(market) {
    if (_.isEmpty(market)) {
        return new Error("获取指数信息列表需要设置市场或服务商");
    }

    let data = await queryData(
        apiNames.indexBasic,
        {
            market,
        },
        apiFields.indexBasic
    );

    return data && data.data;
}

function showInfo() {
    return `共发送请求${requestCount}个，收到${responseCount}个返回，其中${errorCount}个错误`;
}

// export default
module.exports = {
    stockBasic,
    stockCompany,
    stockManagers,
    stockDaily,
    adjustFactor,
    suspendList,
    dailyBasicList,
    dailyBasic,
    indexBasic,
    indexDaily,
    globalIndexList,
    indexMarketList,
    fieldNames,
    showInfo,
};
