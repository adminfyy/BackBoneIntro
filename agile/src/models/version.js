/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone'
],function (Backbone) {
    'use strict';
    var base = Backbone.Model.extend({
        defaults : {
        	'id':null,
            'name': '',
            'description': '',
            'teamId':0,
            'parentId':null,
            'realReleaseDate':null,
            'state':0,

            'handler': '',
            'handlerTime': '',
            'pmsType': '',
            'pmsStartTime': '',
            'pmsRemark': '',
            'pmsResult': '',
            'pmsYsStartTime': '',
            'pmsYsRemark': '',
            'pmsYsResult': '',
            
            'onLinetime': '',
            'liftTestTime': '',
            'versionLiable': ''
        }
    });

    return base;
});