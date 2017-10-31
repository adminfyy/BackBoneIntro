'use strict';


/*使用mock数据*/
/*生产环境*/
var __MOCK__ = false;
var __PROD__ = false;
var __VERSION__ = Date.now();

requirejs.config({
    baseUrl: __PROD__ ? "js/scrum/agile/dist/" : "js/scrum/agile/src/",
    urlArgs: '_=' + __VERSION__,
    map: {
        // '*' means all modules will get 'jquery-private'
        // for their 'jquery' dependency.
        '*': {
            'jquery': 'jquery-private',
            'backbone': 'backbone-private'
        },
        'backbone-private': {
            'backbone': 'backbone'
        },
        'jquery-private': {
            'jquery': 'jquery'
        }
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: [
            'underscore',
            "jquery",

            //plugins
            "jquery_ui",
            "fileUpload",
            "simditor",
            'scrollTo',
            'ztree'
        ],

        simditor: [
            "jquery",
            "../../../lib/simditor/module",
            "../../../lib/simditor/hotkeys",
            "../../../lib/simditor/uploader"
        ],

        "jquery_ui": ["jquery"],
        "fileUpload": ["jquery", "jquery_ui"],
        "scrollTo": ["jquery"]
    },
    paths: {
        backbone: '../../../lib/backbone/backbone.min',
        jquery_ui: '../../../lib/jquery-ui-1.12.1/jquery-ui.min',
        fileUpload: '../../../lib/jquery-upload-file/jquery.fileupload.min',
        underscore: '../../../lib/underscore/underscore.min',
        text: '../../../lib/requirejs-text/text',
        simditor: "../../../lib/simditor/simditor.min",
        Echart: "../../../lib/echart/echarts.min",
        scrollTo: "../../../lib/scrollTo/jquery.scrollTo.min",
        "moment": '../../../lib/moment/moment.min',
        //ztree 模块已修改支持amd
        "ztree": '../../../lib/ztree/jquery.ztree.all.min',
        'mock': '../../../lib/mock/mock-min'
    }
});

if (__PROD__) requirejs(['dist.common']);

function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

/* 加载 css */
loadCss('css/agile.css' + '?_=' + __VERSION__);
loadCss('css/simditor.css');
loadCss('css/zTreeStyle/zTreeStyle.css');
loadCss('css/team-manage.css');