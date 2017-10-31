define('page-team',[
    'views/list-team',
    'views/modal'
], function (AppView, ModalView) {
    return function App() {
        new AppView();
        new ModalView();
    }
});