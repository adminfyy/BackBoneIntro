define('page-main', [
    'views/module-team',
    'views/nav',
    'views/modal',
    'views/modal-split'
], function (AppView, NavView,ModalView, SplitView) {
    return function App() {
        new AppView();
        new NavView();
        new ModalView();
        new SplitView();
    }
});