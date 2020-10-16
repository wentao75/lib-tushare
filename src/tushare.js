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
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        crlf: true,
    },
    prettifier: require("pino-pretty"),
});

// const token = ""
const tushareUrl = "http://api.waditu.com";
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
    cal_date: "日历日期",
    pretrade_date: "上一个交易日",
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
const exchangeList = [
    { code: "SSE", name: "上交所" },
    { code: "SZSE", name: "深交所" },

    // { code: "CFFEX", name: "中金所" },
    // { code: "SHFE", name: "上期所" },
    // { code: "CZCE", name: "郑商所" },
    // { code: "DCE", name: "大商所" },
    // { code: "INE", name: "上能源" },
    // { code: "IB", name: "银行间" },
    // { code: "XHKG", name: "港交所" },
];
const apiNames = {
    stockBasic: "stock_basic",
    stockCompany: "stock_company",
    stockManagers: "stk_managers",
    stockRewards: "stk_rewards",
    // 接口：trade_cal
    // 描述：获取各大交易所交易日历数据,默认提取的是上交所
    tradeCalendar: "trade_cal",
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
    //接口：balancesheet
    //描述：获取上市公司资产负债表
    balanceSheet: "balancesheet",
    // 接口：cashflow
    // 描述：获取上市公司现金流量表
    cashFlow: "cashflow",
    // 接口：forecast
    // 描述：获取业绩预告数据
    forecast: "forecast",
    // 接口：express
    // 描述：获取上市公司业绩快报
    express: "express",
    // 接口：dividend
    // 描述：分红送股数据
    dividend: "dividend",
    // 接口：fina_indicator
    // 描述：获取上市公司财务指标数据
    financialIndicator: "fina_indicator",
    // 接口：fina_mainbz
    // 描述：获得上市公司主营业务构成，分地区和产品两种方式
    financialMainbiz: "fina_mainbz",
    // 接口：disclosure_date
    // 描述：获取财报披露计划日期
    disclosureDate: "disclosure_date",
    // 接口：pledge_stat
    // 描述：获取股票质押统计数据
    pledgeState: "pledge_stat",
    // 接口：pledge_detail
    // 描述：获取股票质押明细数据
    pledgeDetail: "pledge_detail",
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
    tradeCalendar: "exchange,cal_date,is_open,pretrade_date",
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
        "ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,basic_eps,total_revenue,revenue,int_income,prem_earned,comm_income,n_commis_income,n_oth_income,n_oth_b_income,out_prem,une_prem_reser,reins_income,n_sec_tb_income,n_sec_uw_income,n_asset_mg_income,oth_b_income,fv_value_chg_gain,invest_income,ass_invest_income,forex_gain,total_cogs,oper_cost,int_exp,comm_exp,biz_tax_surchg,sell_exp,admin_exp,fin_exp,assets_impair_loss,prem_refund,compens_payout,reser_insur_liab,div_payt,reins_exp,oper_exp,compens_payout_refu,insur_reser_refu,reins_cost_refund,other_bus_cost,operate_profit,non_oper_income,non_oper_exp,nca_disploss,total_profit,income_tax,n_income,n_income_attr_p,minority_gain,oth_compr_income,t_compr_income,compr_inc_attr_p,compr_inc_attr_m_s,ebit,ebitda,insurance_exp,undist_profit,distable_profit,update_flag",
    balanceShet:
        "ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,total_share,cap_rese,undistr_porfit,surplus_rese,special_rese,money_cap,trad_asset,notes_receiv,accounts_receiv,oth_receiv,int_receiv,inventories,amor_exp,nca_within_1y,sett_rsrv,loanto_oth_bank_fi,premium_receiv,reinsur_receiv,reinsur_res_receiv,pur_resale_fa,oth_cur_assets,total_cur_assets,fa_avail_for_sale,htm_invest,lt_eqt_invest,invest_real_estate,time_deposits,oth_assets,lt_rec,fix_assets,cip,const_materials,fixed_assets_disp,produc_bio_assets,oil_and_gas_assets,intain_assets,r_and_d,goodwill,lt_amor_exp,defer_tax_assets,decr_in_disbur,oth_nca,total_nca,cash_reser_cb,depos_in_oth_bfi,prec_metals,deriv_assets,rr_reins_une_prem,rr_reins_outstd_cla,rr_reins_lins_liab,rr_reins_lthins_liab,refund_depos,ph_pledge_loans,refund_cap_depos,indep_acct_assets,client_depos,client_prov,transac_seat_fee,invest_as_receiv,total_assets,lt_borr,st_borr,cb_borr,depos_ib_deposits,loan_oth_bank,trading_fl,notes_payable,acct_payable,adv_receipts,sold_for_repur_fa,comm_payable,payroll_payable,taxes_payable,int_payable,div_payable,oth_payable,acc_exp,deferred_inc,st_bonds_payable,payable_to_reinsurer,rsrv_insur_cont,acting_trading_sec,acting_uw_sec,non_cur_liab_due_1y,oth_cur_liab,total_cur_liab,bond_payable,lt_payable,specific_payables,estimated_liab,defer_tax_liab,defer_inc_non_cur_liab,oth_ncl,total_ncl,depos_oth_bfi,deriv_liab,depos,agency_bus_liab,oth_liab,prem_receiv_adva,depos_received,ph_invest,reser_une_prem,reser_outstd_claims,reser_lins_liab,reser_lthins_liab,indept_acc_liab,pledge_borr,indem_payable,policy_div_payable,total_liab,treasury_share,ordin_risk_reser,forex_differ,invest_loss_unconf,minority_int,total_hldr_eqy_exc_min_int,total_hldr_eqy_inc_min_int,total_liab_hldr_eqy,lt_payroll_payable,oth_comp_income,oth_eqt_tools,oth_eqt_tools_p_shr,lending_funds,acc_receivable,st_fin_payable,payables,hfs_assets,hfs_sales,update_flag",
    cashflow:
        "ts_code,ann_date,f_ann_date,end_date,comp_type,report_type,net_profit,finan_exp,c_fr_sale_sg,recp_tax_rends,n_depos_incr_fi,n_incr_loans_cb,n_inc_borr_oth_fi,prem_fr_orig_contr,n_incr_insured_dep,n_reinsur_prem,n_incr_disp_tfa,ifc_cash_incr,n_incr_disp_faas,n_incr_loans_oth_bank,n_cap_incr_repur,c_fr_oth_operate_a,c_inf_fr_operate_a,c_paid_goods_s,c_paid_to_for_empl,c_paid_for_taxes,n_incr_clt_loan_adv,n_incr_dep_cbob,c_pay_claims_orig_inco,pay_handling_chrg,pay_comm_insur_plcy,oth_cash_pay_oper_act,st_cash_out_act,n_cashflow_act,oth_recp_ral_inv_act,c_disp_withdrwl_invest,c_recp_return_invest,n_recp_disp_fiolta,n_recp_disp_sobu,stot_inflows_inv_act,c_pay_acq_const_fiolta,c_paid_invest,n_disp_subs_oth_biz,oth_pay_ral_inv_act,n_incr_pledge_loan,stot_out_inv_act,n_cashflow_inv_act,c_recp_borrow,proc_issue_bonds,oth_cash_recp_ral_fnc_act,stot_cash_in_fnc_act,free_cashflow,c_prepay_amt_borr,c_pay_dist_dpcp_int_exp,incl_dvd_profit_paid_sc_ms,oth_cashpay_ral_fnc_act,stot_cashout_fnc_act,n_cash_flows_fnc_act,eff_fx_flu_cash,n_incr_cash_cash_equ,c_cash_equ_beg_period,c_cash_equ_end_period,c_recp_cap_contrib,incl_cash_rec_saims,uncon_invest_loss,prov_depr_assets,depr_fa_coga_dpba,amort_intang_assets,lt_amort_deferred_exp,decr_deferred_exp,incr_acc_exp,loss_disp_fiolta,loss_scr_fa,loss_fv_chg,invest_loss,decr_def_inc_tax_assets,incr_def_inc_tax_liab,decr_inventories,decr_oper_payable,incr_oper_payable,others,im_net_cashflow_oper_act,conv_debt_into_cap,conv_copbonds_due_within_1y,fa_fnc_leases,end_bal_cash,beg_bal_cash,end_bal_cash_equ,beg_bal_cash_equ,im_n_incr_cash_equ,update_flag",
    forecast:
        "ts_code,ann_date,end_date,type,p_change_min,p_change_max,net_profit_min,net_profit_max,last_parent_net,first_ann_date,summary,change_reason",
    express:
        "ts_code,ann_date,end_date,revenue,operate_profit,total_profit,n_income,total_assets,total_hldr_eqy_exc_min_int,diluted_eps,diluted_roe,yoy_net_profit,bps,yoy_sales,yoy_op,yoy_tp,yoy_dedu_np,yoy_eps,yoy_roe,growth_assets,yoy_equity,growth_bps,or_last_year,op_last_year,tp_last_year,np_last_year,eps_last_year,open_net_assets,open_bps,perf_summary,is_audit,remark",
    dividend:
        "ts_code,end_date,ann_date,div_proc,stk_div,stk_bo_rate,stk_co_rate,cash_div,cash_div_tax,record_date,ex_date,pay_date,div_listdate,imp_ann_date,base_date,base_share",
    financialIndicator:
        "ts_code,ann_date,end_date,eps,dt_eps,total_revenue_ps,revenue_ps,capital_rese_ps,surplus_rese_ps,undist_profit_ps,extra_item,profit_dedt,gross_margin,current_ratio,quick_ratio,cash_ratio,invturn_days,arturn_days,inv_turn,ar_turn,ca_turn,fa_turn,assets_turn,op_income,valuechange_income,interst_income,daa,ebit,ebitda,fcff,fcfe,current_exint,noncurrent_exint,interestdebt,netdebt,tangible_asset,working_capital,networking_capital,invest_capital,retained_earnings,diluted2_eps,bps,ocfps,retainedps,cfps,ebit_ps,fcff_ps,fcfe_ps,netprofit_margin,grossprofit_margin,cogs_of_sales,expense_of_sales,profit_to_gr,saleexp_to_gr,adminexp_of_gr,finaexp_of_gr,impai_ttm,gc_of_gr,op_of_gr,ebit_of_gr,roe,roe_waa,roe_dt,roa,npta,roic,roe_yearly,roa2_yearly,roe_avg,opincome_of_ebt,investincome_of_ebt,n_op_profit_of_ebt,tax_to_ebt,dtprofit_to_profit,salescash_to_or,ocf_to_or,ocf_to_opincome,capitalized_to_da,debt_to_assets,assets_to_eqt,dp_assets_to_eqt,ca_to_assets,nca_to_assets,tbassets_to_totalassets,int_to_talcap,eqt_to_talcapital,currentdebt_to_debt,longdeb_to_debt,ocf_to_shortdebt,debt_to_eqt,eqt_to_debt,eqt_to_interestdebt,tangibleasset_to_debt,tangasset_to_intdebt,tangibleasset_to_netdebt,ocf_to_debt,ocf_to_interestdebt,ocf_to_netdebt,ebit_to_interest,longdebt_to_workingcapital,ebitda_to_debt,turn_days,roa_yearly,roa_dp,fixed_assets,profit_prefin_exp,non_op_profit,op_to_ebt,nop_to_ebt,ocf_to_profit,cash_to_liqdebt,cash_to_liqdebt_withinterest,op_to_liqdebt,op_to_debt,roic_yearly,total_fa_trun,profit_to_op,q_opincome,q_investincome,q_dtprofit,q_eps,q_netprofit_margin,q_gsprofit_margin,q_exp_to_sales,q_profit_to_gr,q_saleexp_to_gr,q_adminexp_to_gr,q_finaexp_to_gr,q_impair_to_gr_ttm,q_gc_to_gr,q_op_to_gr,q_roe,q_dt_roe,q_npta,q_opincome_to_ebt,q_investincome_to_ebt,q_dtprofit_to_profit,q_salescash_to_or,q_ocf_to_sales,q_ocf_to_or,basic_eps_yoy,dt_eps_yoy,cfps_yoy,op_yoy,ebt_yoy,netprofit_yoy,dt_netprofit_yoy,ocf_yoy,roe_yoy,bps_yoy,assets_yoy,eqt_yoy,tr_yoy,or_yoy,q_gr_yoy,q_gr_qoq,q_sales_yoy,q_sales_qoq,q_op_yoy,q_op_qoq,q_profit_yoy,q_profit_qoq,q_netprofit_yoy,q_netprofit_qoq,equity_yoy,rd_exp,update_flag",
    financialMainbiz:
        "ts_code,end_date,bz_item,bz_sales,bz_profit,bz_cost,curr_type,update_flag",
    disclosureDate:
        "ts_code,ann_date,end_date,pre_date,actual_date,modify_date",
    pledgeState:
        "ts_code,end_date,pledge_count,unrest_pledge,rest_pledge,total_share,pledge_ratio",
    pledgeDetail:
        "ts_code,ann_date,holder_name,pledge_amount,start_date,end_date,is_release,release_date,pledgor,holding_amount,pledged_amount,p_total_ratio,h_total_ratio,is_buyback",

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
    [apiNames.financialMainbiz]: { maxFlow: 60 },
    [apiNames.financialIndicator]: { maxFlow: 200 },
    [apiNames.forecast]: { maxFlow: 200 },
    [apiNames.cashFlow]: { maxFlow: 200 },
    [apiNames.balanceSheet]: { maxFlow: 200 },
    [apiNames.disclosureDate]: { maxFlow: 200 },
    [apiNames.income]: { maxFlow: 200 },
    [apiNames.dividend]: { maxFlow: 300 },
    [apiNames.pledgeDetail]: { maxFlow: 200 },
    [apiNames.moneyFlow]: { maxFlow: 300 },
    [DEFAULT_FLOWCONTROL_NAME]: { maxFlow: 6000 },
};

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
    try {
        const response = await fc.call(axios.post, tushareUrl, {
            api_name: api,
            token: process.env.TUSHARE_TOKEN,
            params,
            fields: fields,
        });

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
    } catch (error) {
        logger.error(`数据接口处理过程发生未知异常：${error}`);
        throw error;
    }
}

/**
 * 重构接口返回数据
 * @param {Array} data http接口返回数据
 */
async function constructData(data) {
    if (!data || data.length <= 0) return data;
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
    try {
        let data = await queryData(
            apiNames.stockBasic,
            {
                exchange,
                list_status: listStatus,
            },
            apiFields.stockBasic
        );
        return data && data.data;
    } catch (error) {
        logger.error(`查询股票列表发生未知异常：${error}`);
        return [];
    }
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

const stockInfo2Params = {
    dividend: {
        name: "dividend",
        api: apiNames.dividend,
    },
    pledgeStat: {
        name: "pledgeStat",
        api: apiNames.pledgeState,
    },
    pledgeDetail: {
        name: "pledgeDetail",
        api: apiNames.pledgeDetail,
    },
};

async function queryStockInfo2(dataName, tsCode) {
    let stockParams = stockInfo2Params[dataName];

    if (!stockParams) {
        return new Error("没有设置要调取的接口名称或者接口不支持！");
    }

    let apiName = stockParams.api;
    if (_.isEmpty(tsCode)) return new Error("个股信息未指定代码");

    let data = await queryData(
        apiName,
        {
            ts_code: tsCode,
        },
        apiFields[apiName]
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

    try {
        let data = await queryData(
            apiNames.suspendInfo,
            {
                trade_date: tradeDate,
            },
            apiFields.suspendInfo
        );
        return data && data.data;
    } catch (error) {
        logger.error(`查询指定日期全部停复盘信息发生未知异常：${error}`);
        return [];
    }
}

/**
 * 获取指定日期的全部股票的基本面指标，如果日期未设置，则取今日指标
 * @param {string} tradeDate 数据日期
 */
async function dailyBasicList(tradeDate = null) {
    if (_.isEmpty(tradeDate)) {
        tradeDate = moment().format("YYYYMMDD");
    }

    try {
        let data = await queryData(
            apiNames.dailyBasic,
            {
                trade_date: tradeDate,
            },
            apiFields.dailyBasic
        );
        return data && data.data;
    } catch (error) {
        logger.error(`查询指定日期全部股票基本面信息发生未知异常：${error}`);
        return [];
    }
}

/**
 * 根据提供的市场/发布商获取指数基础信息列表
 * @param {string} market 市场/发布商
 */
async function indexBasic(market) {
    if (_.isEmpty(market)) {
        return new Error("获取指数信息列表需要设置市场或服务商");
    }

    try {
        let data = await queryData(
            apiNames.indexBasic,
            {
                market,
            },
            apiFields.indexBasic
        );

        return data && data.data;
    } catch (error) {
        logger.error(`查询指数基础信息列表发生未知异常：${error}`);
        return [];
    }
}

/**
 * 查询指定交易所的交易日历数据
 * @param {string} exchange 交易所代码
 * @param {string} startDate 查询开始日期，YYYYMMDD
 * @param {string} endDate 查询结束日期，YYYYMMDD
 */
async function tradeCalendar(exchange, startDate = null, endDate = null) {
    if (_.isEmpty(exchange)) {
        return new Error(apiNames.tradeCalendar + "需要设置查询的交易所代码");
    }
    try {
        let data = await queryData(
            apiNames.tradeCalendar,
            {
                exchange,
                start_date: startDate,
                end_date: endDate,
            },
            apiFields.tradeCalendar,
            async (params, retData) => {
                if (retData && retData.length > 0) {
                    let lastDate = moment(
                        retData[retData.length - 1].cal_date,
                        "YYYYMMDD"
                    );
                    return {
                        exchange,
                        start_date: startDate,
                        end_date: lastDate
                            .subtract(1, "days")
                            .format("YYYYMMDD"),
                    };
                }
                return null;
            }
        );
        return data && data.data;
    } catch (error) {
        logger.error(`查询交易所日历数据发生未知异常：${error}`);
        return [];
    }
}

/**
 * 可以支持queryStockInfo接口的参数配置
 */
const stockInfoParams = {
    daily: {
        name: "daily",
        api: apiNames.daily,
        returnDateFiled: "trade_date",
    },
    adjustFactor: {
        name: "adjustFactor",
        api: apiNames.adjustFactor,
        returnDateFiled: "trade_date",
    },
    suspendInfo: {
        name: "suspendInfo",
        api: apiNames.suspendInfo,
        returnDateFiled: "trade_date",
    },
    dailyBasic: {
        name: "dailyBasic",
        api: apiNames.dailyBasic,
        returnDateFiled: "trade_date",
    },
    moneyFlow: {
        name: "moneyFlow",
        api: apiNames.moneyFlow,
        returnDateFiled: "trade_date",
    },
    // indexDailyBasic: { name: "indexDailyBasic", api: apiNames.indexDailyBasic, returnDateFiled: "trade_date",},
    indexDaily: {
        name: "indexDaily",
        api: apiNames.indexDaily,
        returnDateFiled: "trade_date",
    },
    income: {
        name: "income",
        api: apiNames.income,
        returnDateFiled: "ann_date",
    },
    balanceSheet: {
        name: "balanceSheet",
        api: apiNames.balanceSheet,
        returnDateFiled: "ann_date",
    },
    cashFlow: {
        name: "cashFlow",
        api: apiNames.cashFlow,
        returnDateFiled: "ann_date",
    },
    forecast: {
        name: "forecast",
        api: apiNames.forecast,
        returnDateFiled: "ann_date",
    },
    express: {
        name: "express",
        api: apiNames.express,
        returnDateFiled: "ann_date",
    },
    dividend: {
        name: "dividend",
        api: apiNames.dividend,
        returnDateFiled: "end_date",
    },
    financialIndicator: {
        name: "financialIndicator",
        api: apiNames.financialIndicator,
        returnDateFiled: "ann_date",
    },
    financialMainbiz: {
        name: "financialMainbiz",
        api: apiNames.financialMainbiz,
        returnDateFiled: "end_date",
    },
    disclosureDate: { name: "disclosureDate", api: apiNames.disclosureDate },
};

const stockDataNames = {
    daily: "daily",
    adjustFactor: "adjustFactor",
    suspendInfo: "suspendInfo",
    dailyBasic: "dailyBasic",
    moneyFlow: "moneyFlow",
    // indexDailyBasic: "indexDailyBasic",
    indexDaily: "indexDaily",
    income: "income",
    balanceSheet: "balanceSheet",
    cashFlow: "cashFlow",
    forecast: "forecast",
    express: "express",
    financialIndicator: "financialIndicator",
    financialMainbiz: "financialMainbiz",
    disclosureDate: "disclosureDate",

    dividend: "dividend",
    pledgeStat: "pledgeStat",
    pledgeDetail: "pledgeDetail",
};

/**
 * 符合使用代码，开始日期，结束日期查询接口的通用访问，比较适合于个股数据
 * @param {string} apiName 接口名称，可以用apiNames常量表获取
 * @param {string} tsCode 代码，不一定是股票代码，也可能是市场代码或其它
 * @param {string} startDate 查询开始日期，YYYYMMDD
 * @param {string} endDate 查询结束日期，YYYYMMDD
 * @param {string} returnDateFiled 返回数据中用于确定处理更多数据时候使用的日期字段，默认为trade_date
 * @returns {Array} 返回查询到的全部数据，以及对应的最近和最早的两个日期
 */
async function queryStockInfo(
    dataName,
    tsCode,
    startDate = null,
    endDate = null
) {
    if (stockInfo2Params[dataName]) {
        return queryStockInfo2(dataName, tsCode);
    }

    let stockParams = stockInfoParams[dataName];
    // let isStockInfo = !!queryStockInfoApiNames[dataName];
    // let isStockFinancialInfo = !!queryStockFinancialInfoApiNames[dataName];

    if (!stockParams) {
        return new Error("没有设置要调取的接口名称或者接口不支持！");
    }

    let apiName = stockParams.api;
    // queryStockInfoApiNames[dataName] ||
    // queryStockFinancialInfoApiNames[dataName];
    if (_.isEmpty(tsCode)) {
        return new Error(dataName + "需要设置查询的代码");
    }
    if (_.isEmpty(startDate)) {
        // 需要设置开始日期
        startDate = "19901101";
    }
    if (_.isEmpty(endDate)) {
        endDate = moment().format("YYYYMMDD");
    }

    let returnField = stockParams.returnDateFiled; // returnDateFields[dataName];
    logger.debug(
        `个股数据参数：${dataName}, ${tsCode}, %o, ${apiName}, ${startDate}, ${endDate}, ${returnField}`,
        stockParams
    );

    try {
        let data = await queryData(
            apiName,
            {
                ts_code: tsCode,
                start_date: startDate,
                end_date: endDate,
            },
            apiFields[apiName],
            async (params, retData) => {
                if (retData && retData.length > 0) {
                    logger.debug(
                        `处理日期，${returnField}, %o`,
                        retData[retData.length - 1]
                    );
                    let lastDate = moment(
                        retData[retData.length - 1][returnField],
                        "YYYYMMDD"
                    );
                    return {
                        ts_code: tsCode,
                        start_date: startDate,
                        end_date: lastDate
                            .subtract(1, "days")
                            .format("YYYYMMDD"),
                    };
                }
                return null;
            }
        );
        return [
            data && data.data,
            // 最新日期, end_date
            data && (data.data.length > 0 ? data.data[0][returnField] : null),
            // 最早日期, start_date
            data &&
                (data.data.length > 0
                    ? data.data[data.data.length - 1][returnField]
                    : null),
        ];
    } catch (error) {
        logger.error(`查询股票数据发生未知异常：${error}`);
        return [[], null, null];
    }
}

function showInfo() {
    return `共发送请求${requestCount}个，收到${responseCount}个返回，其中${errorCount}个错误`;
}

// export default
module.exports = {
    stockBasic,
    stockCompany,
    stockManagers,
    // stockDividend,
    suspendList,
    dailyBasicList,
    indexBasic,
    tradeCalendar,
    queryStockInfo,
    exchangeList,
    globalIndexList,
    indexMarketList,
    fieldNames,
    stockDataNames,
    showInfo,

    // stockDaily,
    // dailyBasic,
    // adjustFactor,
    // indexDaily,
    // stockInfoParams,
};
