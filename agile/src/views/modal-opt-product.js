/**
 * Created by fuyy on 2017/4/5.
 * 产品详情页面/ View层逻辑抽象
 */
define([
    'backbone',
    'jquery',
    'common',
    'text!templates/modal-product.html',
    'models/global',
    'collections/product',
    'collections/tag',
    'collections/team-member',
    'views/list-ac',
    'views/list-comment',
    'views/list-attachment',
    'views/list-total-solution',
    'views/modal-opt-split-product'
], function (Backbone, $, Common, ProductTemplate, Global,
             ProductCollection, TagCollection, teamMemberCollection,
             acView, commentView, attachmentView, totalSolutionView, SplitProduct) {
    
    return function (model) {
        
        return {
            
            model: model,
            
            template: _.template(ProductTemplate),
            
            events: {
                "click [role='save']": "saveModel",
                "click #splitBtn": "toSplitView",
                "click [role='delete']": 'deleteModel',
                'submit form': 'noop'
            },
            
            saveModel: function () {
                var that = this;
                this.$("#planPublishDate").attr("disabled", false);
                this.$("#assigner").attr("disabled", false);
                this.$("#priority").attr("disabled", false);
                this.$("#issueType").attr("disabled", false);
                var saveData = this.getFormData();
                var saveUrl = saveData.reqState == 2 ? this.model.updateSprintUrl : this.model.updateUrl;
                this.model.save(saveData, {
                    url: saveUrl,
                    wait: true
                })
                    .done(function (data) {
                        if (that.model.hasChanged('storyNum')) Global.getTotalStoryNum();
                        data.tagName = saveData.reqTagList.map(function (item) {
                            return item.name;
                        }).join(",");
                        data.blockNum =
                            saveData.editBlockList && saveData.editBlockList
                                .filter(function (block) {
                                    return !block.isRemove;
                                }).length ||
                            saveData.addBlockList && saveData.addBlockList
                                .filter(function (block) {
                                    return !block.isRemove;
                                }).length || 0;
                        that.model.set(data);
                        TagCollection.refresh();
                        
                        that.$el.modal("hide");
                    })
                    .fail(function () {
                        layer.alert("修改失败");
                    })
                ;
            },
            
            initPlugins: function () {
                var self = this;
                var fields =
                    [ {
                        field: 'issueType',
                        options: {
                            data: Common.issueTypeOptions
                        },
                        value: this.model.get('issueType')
                    }, {
                        field: 'reqTagList',
                        options: $.extend({}, Common.TAG_SELECT2_OPT, {data: TagCollection.toJSON()}),
                        value: _.pluck(this.model.get("reqTagList"), 'smTagId')
                    }, {
                        field: 'reqRelateList',
                        options: $.extend({}, Common.REL_OPT, {
                            data: ProductCollection.toJSON().filter(function (product) {
                                return product.id !== model.id;
                            }).map(function (product) {
                                product.text = product.subject;
                                return product;
                            })
                        }),
                        value: _.pluck(this.model.get("reqRelateList"), 'relateId')
                    }, {
                        field: 'reqPartyList',
                        options: Common.USER_AJAX_OPT,
                        value: function (index, val) {
                            val = self.model.get("reqPartyList");
                            $(this).html(
                                val.map(function (el) {
                                    return '<option selected value=' + el.userId + '>' + el.userName + "(" + el.accountName + ")" + '</option>';
                                })
                            );
                            return _.pluck(val, "userId");
                        }
                    }, {
                        field: 'assignerId',
                        options: {
                            data: teamMemberCollection.getSelect2Data()
                        },
                        value: this.model.get('assignerId')
                    } ];
                //初始化 DATE-PICKER
                flatpickr("[plugin='date-picker']", {
                    locale: 'zh'
                });
                
                //类型
                fields.forEach(function (i) {
                    self
                        .$('#' + i.field)
                        .select2(i.options)
                        .val(i.value)
                        .trigger('change');
                });
                
                
                //    acList data
                this.acList = new Backbone.Collection(this.model.get('acList'));
                new acView({collection: this.acList, el: this.$('.acList')});
                
                //    acList data
                this.attachmentList = new Backbone.Collection(this.model.get('attachmentList'));
                new attachmentView({collection: this.attachmentList, el: this.$('.attachmentList')});
                
                //    acList data
                this.reqCommentList = new Backbone.Collection(this.model.get('reqCommentList'));
                new commentView({collection: this.reqCommentList, el: this.$('.reqCommentList')});
                
                //    acList data
                this.wikiLinkList = new Backbone.Collection(this.model.get('wikiLinkList'));
                new totalSolutionView({collection: this.wikiLinkList, el: this.$('.totalSolution')});
                
                
                //阻碍项目
                if ((data = this.model.get("blockList"))) {
                    function adapterData (item) {
                        item.is_check = item.isRemove;
                        item.name = item.content;
                        return item;
                    }
                    
                    data.map(adapterData);
                    this.blockList = new Backbone.Collection(data);
                    new acView({collection: this.blockList, el: this.$('.blockList')});
                }
                
                this.showEditor();
                //初始化版本选择 下拉框
                this.versionSelectPlugins();
            },
            
            versionSelectPlugins: function () {
                //版本选择器
                var $el = this.$('#versionId');
                var self = this;
                // ajax.done -> initSelect2Data
                if ($el.length) {
                    Backbone
                        .ajax({
                            url: rootPath + '/version/getVersionList.shtml',
                            data: {teamId: Global.get('team')},
                            dataType: 'json'
                        })
                        .done(function (data) {
                            var list = data[ 'waitReleaseVerList' ] || [];
                            var arrayMap = {};
                            var fakeTreeArray = [];
                            var level = -1;
                            
                            function makeReleaseOneDisabled (i) {
                                if (i.state) i.disabled = true;
                                return i;
                            }
                            
                            function DFS (node) {
                                if (!node) return;
                                level++;
                                node.level = level;
                                
                                fakeTreeArray.push(node);
                                
                                var i = 0,
                                    childList = arrayMap[ node.id ],
                                    length = childList && childList.length || 0;
                                
                                for (; i < length; i++) {
                                    var child = childList[ i ];
                                    DFS(child);
                                }
                                level--;
                                return;
                            }
                            
                            list.map(makeReleaseOneDisabled);
                            
                            list.forEach(function (item) {
                                arrayMap[ item.parentId ] =
                                    arrayMap[ item.parentId ] ?
                                        arrayMap[ item.parentId ] :
                                        [];
                                arrayMap[ item.parentId ].push(item);
                            });
                            
                            DFS({name: "未发布版本", id: '-1'});
                            fakeTreeArray.shift();
                            
                            initSelect2Data(fakeTreeArray || []);
                        });
                    
                    function initSelect2Data (data) {
                        $el
                            .select2({
                                data: data,
                                templateResult: function (item) {
                                    if (item.level > 1) {
                                        return "&nbsp&nbsp&nbsp&nbsp".repeat(item.level) + "└─" + item.name;
                                    }
                                    return item.name;
                                },
                                escapeMarkup: function (string) {
                                    return string;
                                },
                                templateSelection: function (item) {
                                    return item.name || item.text;
                                },
                                minimumResultsForSearch: Infinity
                            })
                            .on("select2:select", function (e) {
                                var itemData = e.params.data;
                                fillData(itemData);
                            });
                        
                        function fillData (data) {
                            $('.version-label').text(data.name);
                            $('#version-plan-release-date').text(data[ 'planReleaseDate' ]);
                            $('#version-status').text(Common.VERSION[ data[ 'state' ] ]);
                        }
                        
                        //初始化Dom内容
                        var data = self.model.get("versionList")[ 0 ] || null;
                        if (data) {
                            $el.val(data.id.toString()).trigger('change');
                            fillData(data);
                        }
                        
                        //初始化下拉框切换效果
                        // if (data && data['state'] == 1) {
                        //     $('.version-id-wrap').remove();
                        // } else {
                        //     $('.version-label').on("click", function () {
                        //         $(this).hide();
                        //         $('.version-id-wrap').show();
                        //     })
                        // }
                    }
                }
            },
            
            showEditor: function () {
                //initial editor
                if (this.isItInSprintAndRunning()) return;
                
                this.$("#description-preview").hide();
                var conf = $.extend({}, Common.simditorDefaultConf, {
                    textarea: this.$("#description")
                });
                this.$description = new Simditor(conf);
            },
            
            toSplitView: function () {
                Backbone.trigger("setModal", SplitProduct(this.model));
                return false;
            },
            
            deleteModel: function () {
                var that = this;
                layer.confirm("是否删除此需求?", {
                    btn: [ '删除', '取消' ]
                }, function (index) {
                    that.model._delete().done(function (res) {
                        if (!res[ Common.SUCCESS ]) return;
                        that.hide();
                    });
                    layer.close(index);
                }, null);
            },
            
            getFormData: function () {
                var dataJson = this.$el.find("form").serializeJson();
                var that = this;
                dataJson.reqTagList = _.flatten([ dataJson.reqTagList ]).filter(function (tag) {
                    return !!tag;
                }).map(function (tag) {
                    var tagModel = TagCollection.get(tag);
                    var newModel = {name: tag};
                    if (tagModel) {
                        newModel = tagModel.toJSON();
                        newModel.smTagId = newModel.id;
                    }
                    newModel.smReqId = that.model.id;
                    return newModel;
                });

//                dataJson.acList = this.acList.toJSON();
                var acList = this.acList.toJSON();
                dataJson.addAcList = acList.filter(function (el) {
                    return !el.id;
                });
                dataJson.editAcList = acList.filter(function (el) {
                    return el.id;
                });
                // modes' acList 与 this.acList 进行对比
                dataJson.delAcList = this.model.get('acList').filter(function (item) {
                    var exist = false;
                    acList.filter(function (el) {
                        if (el.id == item.id) exist = true;
                    });
                    return !exist;
                });
                
                var attachmentList = this.attachmentList.toJSON();
                dataJson.addAttachmentList = attachmentList.filter(function (el) {
                    return !el.id;
                });
                dataJson.editAttachmentList = attachmentList.filter(function (el) {
                    return el.id;
                });
                // modes' attachmentList 与 this.attachmentList 进行对比
                dataJson.delAttachmentList = this.model.get('attachmentList').filter(function (item) {
                    var exist = false;
                    attachmentList.filter(function (el) {
                        if (el.id == item.id) exist = true;
                    });
                    return !exist;
                });
                
                var reqCommentList = this.reqCommentList.toJSON();
                dataJson.addReqCommentList = reqCommentList.filter(function (el) {
                    return !el.id;
                });
                dataJson.editReqCommentList = reqCommentList.filter(function (el) {
                    return el.id;
                });
                // modes' reqCommentList 与 this.reqCommentList 进行对比
                dataJson.delReqCommentList = this.model.get('reqCommentList').filter(function (item) {
                    var exist = false;
                    reqCommentList.filter(function (el) {
                        if (el.id == item.id) exist = true;
                    });
                    return !exist;
                });
                
                var wikiLinkList = this.wikiLinkList.toJSON();
                dataJson.wikiLinkList = wikiLinkList;
                // console.log(dataJson.wikiLinkList);
                // dataJson.addWikiLinkList = wikiLinkList.filter(function (el) {
                //     return !el.id
                // });
                // dataJson.editWikiLinkList = wikiLinkList.filter(function (el) {
                //     return el.id;
                // });
                // // modes' wikiLinkList 与 this.wikiLinkList 进行对比
                // dataJson.delWikiLinkList = this.model.get('wikiLinkList').filter(function (item) {
                //     var exist = false;
                //     wikiLinkList.filter(function (el) {
                //         if (el.id == item.id) exist = true
                //     });
                //     return !exist
                // });
                
                dataJson.reqRelateList = _.flatten([ dataJson.reqRelateList ])
                    .filter(function (el) {
                        return !!el;
                    })
                    .map(function (el) {
                        return {relateId: el};
                    });
                
                dataJson.reqPartyList = _.flatten([ dataJson.reqPartyList ])
                    .filter(function (el) {
                        return !!el;
                    })
                    .map(function (item) {
                        return {
                            userId: item,
                            smReqId: dataJson.id
                        };
                    });
                
                if (dataJson.reqState == 2) {
                    function reformatBlock (el) {
                        var elJson = el.toJSON();
                        elJson.isRemove = elJson.is_check;
                        elJson.busId = dataJson.id;
                        elJson.content = elJson.name;
                        var pickOpt = [ "id", "content", "busId", "isRemove" ];
                        var newOne = _.pick(elJson, pickOpt);
                        return newOne;
                    }
                    
                    var blockList = this.blockList.map(reformatBlock);
                    dataJson.addBlockList = blockList.filter(function (el) {
                        return !el.id;
                    });
                    dataJson.editBlockList = blockList.filter(function (el) {
                        return el.id;
                    });
                    // modes' blockList 与 this.blockList 进行对比.map(reformatBlock)
                    dataJson.delBlockList = this.model.get('blockList').filter(function (item) {
                        var exist = false;
                        blockList.filter(function (el) {
                            if (el.id == item.id) exist = true;
                        });
                        return !exist;
                    });
                }
                //界面的是否就绪已不展示，故dataJson.isReady都会是undefind.去掉该赋值
                //dataJson.isReady = dataJson.isReady ? dataJson.isReady : 0;
                dataJson.isBug = dataJson.isBug ? dataJson.isBug : 0;
                dataJson.planPublishDate || (dataJson.planPublishDate = null);
                dataJson.assigner = teamMemberCollection.getMemberName(dataJson.assignerId);
                
                return dataJson;
            },
            
            getTemplateData: function () {
                var isItInSprintAndRunning = this.isItInSprintAndRunning();
                var isVersionManagement = Global.defaults.board;
                var jiraUrl = Global.defaults.jiraUrl;
                return $.extend({}, this.model.toJSON(), {isItInSprintAndRunning: isItInSprintAndRunning, isVersionManagement:isVersionManagement, jiraUrl: jiraUrl});
            },
            isItInSprintAndRunning: function () {
                return this.model.get('reqState') === 2 && Global.isSprintRunning();
            },
            
            noop: function (e) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        };
    };
});