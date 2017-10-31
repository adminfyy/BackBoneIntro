/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/lane',
    'models/global',
    'common'
], function (Backbone, Model, Global, Common) {
    'use strict';
    //开发面板使用的 泳道列表接口 ps: 竖直方向上面的列

    var lanes = Backbone.Collection.extend({

        model: Model,

        comparator: 'pos',

        url: rootPath + "/boardLane/getBoardLaneList.shtml",

        refresh: function () {
            return this.fetch({
                reset: true,
                data: {
                    teamId: Global.get('team')
                }
            })
        },

        resFilter: function (res) {
            return res
        },

        hasTestLane: function () {
            var ret = this.findWhere({type: Common.LANE.TEST}) || false;
            return ret;
        }
    });
    /*
     * 需求列表容器
     * 数据来源 demand collections
     * {
     *  "IsDone": 0,
     *  "IsEdit": 0,
     *  "pos":10,
     *  "name":"需求就绪2",
     *  "smBoardId":1,
     *  "description":"已就绪的当前迭代需求",
     *  "id":1,
     *  "state":"需求就绪",
     *  "type":10,
     *  dod: xxx
     *  dor: xxx
     *  }
     * */
    return new lanes();
})