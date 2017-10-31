({
    baseUrl: "./src",
    dir: './dist',
    map: {
        '*': {
            //jquery垫片  通过Private使用全局$
            'jquery': 'jquery-private'
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
        //ztree 模块已修改支持amd
        "ztree": '../../../lib/ztree/jquery.ztree.all.min'
    },
    removeCombined: true,
    modules: [
        {
            name: 'page-main',
            exclude: ["backbone", "jquery_ui", "fileUpload", "underscore", "simditor", "scrollTo", "ztree"]
        }, {
            name: 'page-team',
            exclude: ["backbone", "jquery_ui", "fileUpload", "underscore", "simditor", "scrollTo", "ztree"]
        }, {
            name: 'page-version',
            exclude: ["backbone", "jquery_ui", "fileUpload", "underscore", "simditor", "scrollTo", "ztree"]
        }, {
            name: 'page-demand-board',
            exclude: ["backbone", "jquery_ui", "fileUpload", "underscore", "simditor", "scrollTo", "ztree"]
        }
    ]
})

/* 对比webpack 以及r.js打包amd模块
* r.js 将公共模块打包到一起
*
*
* 使用方法: 通过 npm install requirejs -g 后
* 在本目录下使用 r.js -o r.build.js 即可
*
* 缺陷： 会拷贝html文件到dist/templates下 待解决
* */