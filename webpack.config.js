const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack')
/*
* 打包压缩后请手动更换使用的文件路径
* */
module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: {
        'page-main': './page-main.js',
        "page-team": './page-team.js',
        'page-version': './page-version.js',
        'page-demand-board': './page-demand-board.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, "dist"),
        publicPath: 'js/scrum/agile/dist/',
        libraryTarget: 'amd'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src')],
        extensions: [".js", ".html"],
        alias: {
            // 'backbone': path.resolve(__dirname,'../../','lib/backbone.min')
        }
    },
    resolveLoader: {
        alias: {
            text: 'text-loader'
        }
    },
    externals: {
        jquery: 'jquery',
        backbone: 'backbone',
        simditor: 'simditor',
        Echart: 'Echart',
        mock: 'mock'
    },

    stats: 'verbose',
    plugins: [
        new UglifyJSPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'dist.common'
        })
    ]
};

// webpack 打包入口必须为 define 模块 文件
