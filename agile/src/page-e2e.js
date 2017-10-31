define('page-e2e', [
    'views/e2e-filter',
    'views/e2e-list'
], function (filterView, listView) {
    return function App() {
        new filterView();
        new listView();
    }
});