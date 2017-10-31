define([
        'backbone',
        'models/global'
    ],
    function (Backbone, Global) {
        var constructor = Backbone.Collection.extend({
            url: 'version/getVersionList.shtml',
            fetch: function (opts) {
                var teamId = Global.get('team');
                if (!teamId) return false;
                opts || (opts = {});
                _.extend(opts, {
                    data: {
                        teamId: teamId
                    }
                });
                return Backbone.Collection.prototype.fetch.call(this, opts)
            },

            getSelect2Data: function () {
                var data = this.toJSON();
                data.map(function (d) {
                    d.text = d.name;
                    return d;
                })
                return data
            },

            getZtreeData: function() {
                return this.toJSON();
            },

            resFilter: function (res) {
                res.waitReleaseVerList || (res.waitReleaseVerList = [])
                return res.waitReleaseVerList
            }
        });
        var instance = new constructor();
        instance.fetch();
        return instance;
    })