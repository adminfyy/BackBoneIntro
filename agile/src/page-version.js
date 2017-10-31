define('page-version',[
    'views/modal',
    'views/team-board-version'
], function (ModalView, AppView) {
    return function App() {
        new ModalView();
        new AppView();
    }
});