/**
 * Created by fuyy on 2017/3/31.
 */
define([
        'jquery',
        'views/list',
        'views/list-demand-item',
        'collections/demand',
        'models/global',
        'common'
    ],
    /*
    * 需求列表容器
    * 数据来源 demand collections
    * */
    function ($, StageView, DemandView, Demand, Global, Common) {

        return StageView.extend({

            collection: Demand,

            //tools name命名必须来自于bootstrap的icon 最后一个单词

            tools: [{
//                name: 'search',
//                label: '搜索'
//            }, {
                name: "refresh",
                label: "刷新"

            }, {
                name: "sort",
                label: "排序"
            }],

            popover: [
                {
                    name: "priority-sort",
                    value: "优先级排序"
                }, {
                    name: "deadline-sort",
                    value: "截止时间排序"
                }
            ],

            initDataListening: function () {
                this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 500));
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(this.collection, 'requesting', this.waitingForResp);
                this.listenTo(Global, 'change', this.globalModelChange);
                this.listenTo(this.model,'change', this.toggleVisible)
                Backbone.off('DEMAND-REFRESH').on('DEMAND-REFRESH', this.initData.bind(this))
            },

            initData: function () {
                this.collection.refresh()
            },

            getQuery: function () {
                var query = this.model.get('currentQuery');
                if (!query) {
                    this.model.set("currentQuery", {
                        teamId: Global.get('team')
                    })
                }
                return this.model.get('currentQuery')
            },

            updateQuery: function () {
                this.model.set("currentQuery", {
                    teamId: Global.get('team')
                })
            },

            globalModelChange: function () {
                if (Global.hasChanged("team")) {
                    this.updateQuery();
                    this.initData();
                }
            },

            addOne: function (item) {
                var $taskView = new DemandView({model: item, id: item.get("id")});
                this.$taskList.append($taskView.render().el);
            },

            receiveSortable: function (event, ui) {
            },

            removeSortable: function (event, ui) {
            },

            updateSortable: function (event, ui) {

                var $el = $(ui.item[0]);

                //如果被移动到本列表之外, 不进行排序更新操作
                if (!$el.closest("#demand-list").length) return;

                var
                    $elPrev = $el.prev().data("id"),
                    $elNext = $el.next().data("id"),

                    preModel = this.collection.get($elPrev),
                    nextModel = this.collection.get($elNext),

                    preRank = Number(preModel && preModel.get('rank')),
                    nextRank = Number(nextModel && nextModel.get('rank'));

                var newRank = 0;

                if (isNaN(preRank) || isNaN(nextRank)) {
                    if (isNaN(preRank)) {
                        newRank = nextRank - 1
                    } else {
                        newRank = preRank + 1
                    }
                } else {
                    newRank = (preRank + newRank) / 2
                }


                $.get(Common.URL.editDemand,
                    {
                        issueKey: $el.data("id"),
                        rank: newRank
                    })
                    .done(
                        this.collection.refresh.bind(
                            this.collection, {
                                silent: true
                            }
                        )
                    )
            },

            refresh: function () {
                this.initData(false);
            },

            initViewExtra: function () {
                var defaultHeader = this.$('.item-header');
                // var searchPanel = Backbone.$('<span class="search flex"></span>');
                // searchPanel.insertBefore(this.$tools);
                var searchPanel = this.$search = Backbone.$('<header class="item-header flex start"></header>');
                var $select = this.$typeFilter = Backbone.$('<select name="typeFilter"></select>');
                searchPanel.insertAfter(defaultHeader);

                $select.width('7em')
                    .appendTo(searchPanel)
                    .select2({
                        minimumResultsForSearch: Infinity,
                        theme: 'bootstrap',
                        data: [{
                            id: -1,
                            text: '请选择...'
                        }, {
                            id: 1,
                            text: '内部运营需求'
                        }, {
                            id: 2,
                            text: '外部商用需求'
                        }, {
                            id: 3,
                            text: '缺陷'
                        }]
                    });

                var $input = this.$titleFilter = Backbone.$('<input type="search" class="form-control" style="width: 15em" name="titleFilter" placeholder="查找需求标题.."/>');
                $input.appendTo(searchPanel);

                var $searchButton = Backbone.$('<button type="button"  class="btn btn-primary">搜索</button>');
                $searchButton.appendTo(searchPanel);

                $searchButton.on('click', this.searchDemand.bind(this));
            },

            searchDemand: function () {
                var typeFilter = this.$typeFilter.val();
                var titleFilter = this.$titleFilter.val();
                var data = {
                    teamId: Global.get('team')
                };

                if (titleFilter.trim().length) _.extend(data, {
                    subject: titleFilter,
                });

                switch (Number(typeFilter)) {
                    case -1:
                        break;
                    case 1:
                        // issueType为1（需求）reqCategoryGroup=内部运营需求,内部架构优化需求
                        data.issueType = 1;
                        data.reqCategoryGroup = '内部运营需求,内部架构优化需求';
                        break;
                    case 2:
                        data.issueType = 1;
                        data.reqCategoryGroup = '外部商用需求';
                        break;
                    case 3:
                        data.issueType = 2;
                        break;
                    default:
                }

                this.collection.search(data)

            },
            prioritySort: function () {
                this.collection.prioritySort();
            },

            deadlineSort: function () {
                this.collection.deadlineSort();
            }

//            search: function () {
//                this.$search.toggle();
//            }

        });
    });