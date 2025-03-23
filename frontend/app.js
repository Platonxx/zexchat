// 다크 모드 기능
document.querySelector('.dark-mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// 메시지 입력창 크기 자동 조정
document.getElementById('message-input').addEventListener('input', function () {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
});