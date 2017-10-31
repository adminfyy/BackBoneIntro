/*global define*/
'use strict';

define(function () {
    
    return {


        sortDate: function (a, b) {
            return a.valueOf() - b.valueOf();
        },
        
        SELECTED_COLOR: 'white',
        UNSELECTED_COLOR: 'whitesmoke',
        
        validateVersionInfo: function (data) {
            var $re1 = new RegExp("/^(?:([0-9A-Za-z.\\-\\_]+)){1}" //1,版本号
                + ".(?:(el5|el6|el7)){1}" //2,内核版本
                + ".(?:(i386|x86_64|noarch)){1}" //3,机器位类型
                + ".(?:(zip|rpm)){1}$/"); //4,包类型
            
            if (data.name.length < 1 || /\s/.test(data.name) || $re1.test(data.name)) {
                layer.msg('版本名称不符合规范');
                return;
            }
            
            if (!data.planStartDate.length) {
                layer.msg('请选择计划开始时间');
                return;
            }
            
            if (!data.planReleaseDate.length) {
                layer.msg('请选择预期发布时间');
                return;
            }
            return true;
        },
        
        VERSION: [ "未发布", "已发布" ],
        
        simditorDefaultConf: {
            pasteImage: true,
            upload: {
                url: rootPath + "/uploadFile/fileUpload.shtml",
                params: {
                    projectKey: "screenshots/",
                },
                fileKey: 'file',
                connectionCount: 3,
                leaveConfirm: 'Uploading is in progress, are you sure to leave this page?'
            }
        },
        
        priorityOptions: [ {
            id: 1,
            text: '最高'
        }, {
            id: 2,
            text: '高'
        }, {
            id: 3,
            text: '中',
            selected: true
        }, {
            id: 4,
            text: '低'
        } ],
        
        createIssueTypeOptions: [ {
            id: 3,
            text: '组内需求',
            selected: true
        }, {
            id: 5,
            text: '组内缺陷'
        }, {
            id: 6,
            text: '简单任务'
        } ],
        
        issueTypeOptions: [ {
            id: 1,
            text: '客户需求'
        }, {
            id: 2,
            text: '公司内部需求'
        }, {
            id: 3,
            text: '组内需求'
        }, {
            id: 4,
            text: '运营缺陷'
        }, {
            id: 5,
            text: '组内缺陷'
        }, {
            id: 6,
            text: '简单任务'
        } ],
        
        
        SUCCESS: 'success',
        MSG: 'msg',
        
        ENTER_KEY: 13,
        ESCAPE_KEY: 27,
        LEFT_DOWN: 1,
        
        DEMAND_BOARD: 1,
        DEV_BOARD: 2,
        
        LANE: {
            DEMAND: 10,
            TASK: 20,
            TEST: 30,
            VALIDATE: 40
        },
        
        Echart: {
            BurnDown: {
                title: {
                    text: '燃尽图'
                },
                
                legend: {
                    data: [ '实际线', '参考线' ],
                    left: 'right',
                    top: 'middle',
                    orient: 'vertical'
                },
                
                tooltip: {
                    trigger: 'axis'
                },
                
                xAxis: {
                    type: 'category',
                    name: '日期'
                },
                yAxis: {
                    type: 'value',
                    name: '剩余故事点'
                },
                series: [ {
                    type: 'line',
                    name: '实际线',
                    data: []
                } ]
            }
        },
        
        //jquery ui 设定
        defaultSortOpt: {
            default: {
                // placeholder: "task-list-item-placeholder"
            },
            
            sprint: {
                items: ".task-list-item",
                placeholder: "task-list-item-placeholder",
                connectWith: "#product-list",
                helper: "clone",
                revert: true,
                containment: "window",
                cursor: "move",
                forcePlaceholderSize: true
            },
            
            backlog: {
                placeholder: "task-list-item-placeholder",
                helper: "clone",
                containment: "window",
                cursor: "move",
                connectWith: '#versionSelected',
                forcePlaceholderSize: true
            },
            
            versionSelected: {
                placeholder: "task-list-item-placeholder",
                helper: "clone",
                containment: "window",
                cursor: "move",
                connectWith: '#backlog',
                forcePlaceholderSize: true
            }
        },
        
        boardList: [
            {id: 1, text: '需求管理'},
            {id: 2, text: '当前迭代'},
            {id: 3, text: '版本管理'},
            {id: 4, text: '迭代管理'}
        ],
        
        rangeType: [
            {id: 1, text: '用户期望'},
            {id: 2, text: '创建时间'}
        ],
        
        comIdList: [
            {id: 1, level: 1, parentId: -1, text: 'ACCA'},
            {id: 2, level: 2, parentId: 1, text: 'SI'},
            {id: 3, level: 3, parentId: 2, text: 'BSC'},
            {id: 4, level: 1, parentId: -1, text: 'UED'},
            {id: 5, level: 2, parentId: 4, text: 'WMD'},
            {id: 6, level: 2, parentId: 4, text: 'BBC'}
        ],
        
        URL: {

            editProduct: rootPath + "/productReq/editReq.shtml",
            viewProductDetail: rootPath + "/productReq/productReqDetail.shtml",
            dragProductOrder: rootPath + "/productReq/dragProductOrder.shtml"
        },
        
        TAG_SELECT2_OPT: {
            tags: true,
            
            templateResult: function (result) {
                return result.text || result.name;
            },
            
            templateSelection: function (result) {
                return result.text || result.name;
            }
        },
        
        //关联内容 select2 配置项
        REL_OPT: {
            templateResult: function (result) {
                return result.text || result.subject;
            },
            
            templateSelection: function (state, $container) {
                state.text || (state.text = state.subject);
                $container.css("width", "99%");
                
                $container.find('[role="presentation"]')
                    .css("float", "right")
                    .before('<span>' + state.text + '</span>');
                return $container;
            }
        },
        
        USER_OPT: {
            placeholder: "未指派",
            
            templateResult: function (result) {
                return result.text || result.userName;
            },
            
            templateSelection: function (result) {
                return result.text || result.userName;
            }
        },
        
        USER_AJAX_OPT: {
            placeholder: '请选择用户',
            ajax: {
                dataType: 'json',
                url: rootPath + '/user/searchUserByName.shtml',
                data: function (params) {
                    return {
                        term: params.term
                    };
                },
                processResults: function (data) {
                    return {
                        results: data
                    };
                }
            },
            
            minimumInputLength: 1,
            
            templateResult: function (result) {
                return result.text || result.userName + '(' + result.accountName + ')';
            },
            
            templateSelection: function (result) {
                return result.text || result.userName + '(' + result.accountName + ')';
            }
            
        },
        
        TEAM_COM_OPT: {
            placeholder: '请选择组件',
            language: 'zh-CN',
            ajax: {
                dataType: 'json',
                url: 'component/getTeamComList.shtml',
                data: function (params) {
                    return {
                        term: params.term
                    };
                },
                processResults: function (res) {
                    res.comList || (res.comList = []);
                    var data = res.comList;
                    data.map(function (d) {
                        d.id = d.comId;
                        d.text = d.name;
                        return d;
                    });
                    return {
                        results: data
                    };
                },
                
                cache: true,
            },
            minimumResultsForSearch: Infinity
            
        },
        
        TEAMMEMBER_OPT: {
            
            placeholder: "未指派",
            
            templateResult: function (result) {
                return result.name || result.id;
            },
            
            templateSelection: function (result) {
                return result.name || result.id;
            }
        },
        
        afterReceive: function (event, ui, CardView) {
            var $target = ui.item;
            var $sender = ui.sender;
            var childSelector = '[data-parent-id="{pid}"]';
            var itemSelector = '[data-id="{id}"]';
            var parentSelector = itemSelector.replace('{id}', $target.attr('data-parent-id'));
            var childrenSelector = childSelector.replace('{pid}', $target.attr('data-id'));
            
            //移动穿插在二级卡片的一级卡片的位置
            if (ui.item.next().attr('child-card')) {
                ui.item.insertAfter(ui.item.nextUntil(":not('[child-card]')").last());
            }
            
            // 【1】一级卡片
            var isParent = !$target.attr('child-card');
            if (isParent) {
                //判断是否为新建卡片
                //移动model至本collection
                var model = $target.data('model');
                //【1.1】更新
                if (this.collection.has(model.id)) {
                    this.$taskList.find(childrenSelector).removeClass('disabled').trigger('fetch');
                    $sender.find(childrenSelector).remove();
                    $target.remove();
                    return false;
                } else {
                    //【1.2】新建卡片
                    //删除原来的子节点
                    $sender.find(childrenSelector).remove();
                    model.collection.remove(model);
                    model.off();
                    model = this.collection.push(model);
                    new CardView({model: model})
                        .fetch()
                        .render()
                        //加载所有二级卡片到当前列表
                        .loadChild()
                        .$el.insertAfter($target);
                    $target.remove();
                    return false;
                }
                //【2 二级卡片拖拽】
            } else {
                var parent = parentSelector;
                var thisParentDom = this.$taskList.find(parent);
                var thatParentDom = $sender.find(parent);
                // 【2.1】新建
                if (!thisParentDom.length) {
                    var $parent = $sender.find(parent);
                    var parentModel = $parent.data('model').clone();
                    parentModel = this.collection.push(parentModel);
                    new CardView({model: parentModel}).render()
                        .loadChild()
                        .$el
                        .insertAfter($target)
                        .trigger('fetch');
                    thatParentDom.trigger('refresh-children-data').trigger('fetch');
                    $sender.sortable('cancel');
                    // 【2.1】更新
                    return false;
                } else {
                    thisParentDom.trigger('refresh-children-data').trigger('fetch');
                    thatParentDom.trigger('refresh-children-data').trigger('fetch');
                    $sender.sortable('cancel');
                    return false;
                }
            }
            return false;
        }
    };
});
