define('page-demand-board', [
    'views/business-select',
    'views/list-demand-business-filter',
    'views/list-demand-business',
    'views/modal'
], function (businessSelect, demandFilter, demandList, modal) {
    return function App() {
        new businessSelect();
        new demandFilter();
        new demandList();
        new modal();
    }
});