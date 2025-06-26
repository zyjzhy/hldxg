// 全局游戏状态
const gameState = {
    score: 0,
    level: 1,
    steps: 50,
    maxSteps: 50,
    targetWatermelon: 1,
    watermelonCount: 0,
    hasRevived: false,
    petSkillUsed: false,
    petSkillAdUsed: false,
    gameActive: false,
    selectedTool: null,
    swapFirstFruit: null,
    nextFruit: null,
    fruits: [],
    gridPoints: [],
    gridRows: 8,
    gridCols: 8,
    // 新增：格子总数
    totalGridPoints: 8 * 8, 
    // 新增：可随机放置水果的前 5 种水果索引范围
    randomFruitLevels: [0, 1, 2, 3, 4],
    gridSize: 0,    
    etLongTouchTimer: null,
    petSkillAdWatched: false,
    tools: {
        hammer: 1,
        swap: 1,
        freeze: 1,
        bomb: 0,
        addSteps: 1
    },
    toolUsage: { // 每关中每个道具的使用次数
        hammer: 0,
        swap: 0,
        freeze: 0,
        bomb: 0,
        addSteps: 0
    },
    dailyToolFreeUsed: { // 每天免费使用标记
        hammer: false,
        swap: false,
        freeze: false,
        bomb: false,
        addSteps: false
    },
    toolAdUsed: { // 每天广告使用标记
        hammer: false,
        swap: false,
        freeze: false,
        bomb: false,
        addSteps: false
    },
    isPetDragging: false,
    petDragOffset: { x: 0, y: 0 },
    petPosition: { x: 'auto', y: 'auto', right: '1rem', bottom: '1rem' },
    petSkillTriggered: false,
    themes: {
        fruit: {
            background: '#E4F5FF',
            grid: '#A1B9E0',
            fruits: [
                { emoji: '🍓', size: 20, color: '#FF69B4', points: 10 },
                { emoji: '🍇', size: 22, color: '#8A2BE2', points: 20 },
                { emoji: '🍊', size: 24, color: '#FFA500', points: 30 },
                { emoji: '🍋', size: 26, color: '#FFFF00', points: 40 },
                { emoji: '🍎', size: 28, color: '#FF0000', points: 50 },
                { emoji: '🍐', size: 30, color: '#9ACD32', points: 60 },
                { emoji: '🍍', size: 32, color: '#FFD700', points: 70 },
                { emoji: '🍉', size: 34, color: '#008000', points: 80 }
            ]
        },
        candy: {
            background: '#FFE4E1',
            grid: '#FFB6C1',
            fruits: [
                { emoji: '🍭', size: 20, color: '#FF69B4', points: 10 },
                { emoji: '🍬', size: 22, color: '#FFB5C5', points: 20 },
                { emoji: '🍫', size: 24, color: '#D2691E', points: 30 },
                { emoji: '🍩', size: 26, color: '#FFC0CB', points: 40 },
                { emoji: '🍪', size: 28, color: '#F5DEB3', points: 50 },
                { emoji: '🍰', size: 30, color: '#FFD700', points: 60 },
                { emoji: '🍦', size: 32, color: '#87CEEB', points: 70 },
                { emoji: '🍨', size: 34, color: '#FFA500', points: 80 }
            ]
        },
        china: {
            background: '#FFF0F5',
            grid: '#CD5C5C',
            fruits: [
                { emoji: '🍅', size: 20, color: '#FF6347', points: 10 },
                { emoji: '🌶️', size: 22, color: '#FF4500', points: 20 },
                { emoji: '🍊', size: 24, color: '#FFA500', points: 30 },
                { emoji: '🍈', size: 26, color: '#98FB98', points: 40 },
                { emoji: '🍇', size: 28, color: '#8A2BE2', points: 50 },
                { emoji: '🍑', size: 30, color: '#FFDAB9', points: 60 },
                { emoji: '🍍', size: 32, color: '#FFD700', points: 70 },
                { emoji: '🍉', size: 34, color: '#008000', points: 80 }
            ]
        }
    },
    currentTheme: 'fruit'
};

// ------------------ 网格及水果位置 ------------------
function createGrid() {
    const gameArea = document.querySelector('.game-grid-container');
    const gameGrid = document.querySelector('.game-grid');

    // 获取游戏容器的位置信息
    const gameAreaRect = gameArea.getBoundingClientRect();
    gameState.gameAreaOffset = {
        left: gameAreaRect.left,
        top: gameAreaRect.top
    };

    // 计算网格大小，确保是正方形
    const availableWidth = gameArea.clientWidth;
    const availableHeight = gameArea.clientHeight;
    const gridSize = Math.min(availableWidth, availableHeight) / 8; // 修改为 8

    // 设置游戏区域大小，确保网格是正方形
    const gridContainerSize = gridSize * 8; // 修改为 8
    gameArea.style.width = `${gridContainerSize}px`;
    gameArea.style.height = `${gridContainerSize}px`;
    gameArea.style.margin = '0 auto';

    // 清空并重新创建网格
    gameGrid.innerHTML = '';
    gameGrid.style.gridTemplateColumns = `repeat(8, ${gridSize}px)`; // 修改为 8
    gameGrid.style.gridTemplateRows = `repeat(8, ${gridSize}px)`; // 修改为 8

    // 初始化网格点数据
    gameState.gridSize = gridSize;
    gameState.gridPoints = [];

    for (let row = 0; row < 8; row++) { // 修改为 8
        for (let col = 0; col < 8; col++) { // 修改为 8
            // 计算相对于游戏容器的坐标
            const x = col * gridSize + gridSize / 2;
            const y = row * gridSize + gridSize / 2;

            // 创建网格单元格
            const cell = document.createElement('div');
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameGrid.appendChild(cell);

            // 保存网格点数据
            gameState.gridPoints.push({
                x, y, row, col, occupied: false
            });
        }
    }

    // 添加网格背景线
    updateThemeStyles();
}

// ------------------ 水果生成 ------------------
function generateNextFruit() {
    const theme = gameState.themes[gameState.currentTheme];
    let fruitLevel;
    
    if (gameState.level === 1) {
        const candidates = [4, 5, 6];
        fruitLevel = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
        const candidates = [0, 1, 2, 3, 4];
        fruitLevel = candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    gameState.nextFruit = fruitLevel;
    const nextFruitEl = document.getElementById('nextFruit');
    nextFruitEl.textContent = theme.fruits[fruitLevel].emoji;
    nextFruitEl.style.background = theme.fruits[fruitLevel].color;
}

// 查找水果
function findFruitByRowCol(row, col) {
    return gameState.fruits.find(f => f.row === row && f.col === col);
}

// 添加水果到网格
function addFruitAtGrid(row, col, level) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return; // 修改为 8
    const gridPoint = getGridPointByRowCol(row, col);
    if (!gridPoint || gridPoint.occupied) return;

    const theme = gameState.themes[gameState.currentTheme];
    const fruitData = theme.fruits[level];

    const x = gridPoint.x;
    const y = gridPoint.y;

    const fruit = {
        id: Date.now() + Math.random(),
        level,
        row,
        col,
        x,
        y,
        element: null,
        gridPoint
    };

    gameState.fruits.push(fruit);
    gridPoint.occupied = true;

    const fruitEl = document.createElement('div');
    fruitEl.className = 'fruit absolute';
    fruitEl.dataset.id = fruit.id;
    fruitEl.dataset.level = level;
    fruitEl.textContent = fruitData.emoji;
    fruitEl.style.fontSize = `${fruitData.size}px`;

    // 修正位置计算，确保相对于游戏容器
    fruitEl.style.left = `${x - fruitData.size / 2}px`;
    fruitEl.style.top = `${y - fruitData.size / 2}px`;
    fruitEl.style.width = `${fruitData.size * 1.2}px`;
    fruitEl.style.height = `${fruitData.size * 1.2}px`;
    fruitEl.style.backgroundColor = fruitData.color;
    fruitEl.style.borderRadius = '50%';
    fruitEl.style.display = 'flex';
    fruitEl.style.alignItems = 'center';
    fruitEl.style.justifyContent = 'center';
    fruitEl.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';

    fruitEl.style.zIndex = '10';
    fruitEl.style.transition = 'all 0.2s';

    // 添加动画效果
    fruitEl.style.opacity = '0';
    fruitEl.style.transform = 'scale(0.5)';

    fruit.element = fruitEl;
    document.querySelector('.game-grid-container').appendChild(fruitEl);

    // 触发动画
    setTimeout(() => {
        fruitEl.style.opacity = '1';
        fruitEl.style.transform = 'scale(1)';
    }, 10);

    // 落子后立即检查游戏状态
    setTimeout(() => {
        checkMerges(fruit);
        checkGameTarget();
    }, 200);
}

// 获取网格点
function getGridPointByRowCol(row, col) {
    return gameState.gridPoints.find(p => p.row === row && p.col === col);
}

// ------------------ 水果合并判定 ------------------
// ------------------ 水果合并判定 ------------------
function getMergeGroups(fruit) {
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 }
    ];
    const groups = [];

    for (const dir of directions) {
        const group = [fruit];
        let r = fruit.row + dir.dy;
        let c = fruit.col + dir.dx;

        // 向右/下查找相同水果
        while (r >= 0 && r < 8 && c >= 0 && c < 8) { // 修改为 8
            const f = findFruitByRowCol(r, c);
            if (f && f.level === fruit.level) {
                group.push(f);
                r += dir.dy;
                c += dir.dx;
            } else {
                break;
            }
        }

        // 向左/上查找相同水果
        r = fruit.row - dir.dy;
        c = fruit.col - dir.dx;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) { // 修改为 8
            const f = findFruitByRowCol(r, c);
            if (f && f.level === fruit.level) {
                group.unshift(f);
                r -= dir.dy;
                c -= dir.dx;
            } else {
                break;
            }
        }

        if (group.length >= 3) groups.push(group);
    }
    return groups;
}

function mergeFruitsGroups(groups) {
    if (!groups || groups.length === 0) return;
    
    const toMergeFruits = new Set();
    groups.forEach(group => {
        group.forEach(f => toMergeFruits.add(f));
    });
    
    if (toMergeFruits.size === 0) return;
    
    // 最后落子为id最大水果
    const lastFruit = Array.from(toMergeFruits).reduce((a, b) => (a.id > b.id ? a : b));
    const theme = gameState.themes[gameState.currentTheme];
    const mergeLevel = lastFruit.level;
    const newLevel = mergeLevel + 1;
    
    // 添加合并动画
    toMergeFruits.forEach(fruit => {
        if (fruit.element) {
            fruit.element.style.transition = 'all 0.3s';
            fruit.element.style.transform = `scale(1.2)`;
            fruit.element.style.opacity = '0';
        }
    });
    
    setTimeout(() => {
        toMergeFruits.forEach(fruit => removeFruit(fruit.id));
        
        if (newLevel <= theme.fruits.length - 1) {
            addFruitAtGrid(lastFruit.row, lastFruit.col, newLevel);
            
            // 计算合并得分（基础分+连击加成）
            const basePoints = theme.fruits[newLevel].points;
            const comboBonus = Math.floor(toMergeFruits.size / 3) * 0.5;
            const pointsEarned = Math.floor(basePoints * toMergeFruits.size * (1 + comboBonus));
            gameState.score += pointsEarned;
            
            // 显示得分动画
            showScorePopup(lastFruit.x, lastFruit.y, pointsEarned);
            
            if (newLevel === theme.fruits.length - 1) {
                gameState.watermelonCount++;
                showToast("恭喜！合成了大西瓜！");
            }
            
            showMergeEffect(lastFruit.x, lastFruit.y, theme.fruits[newLevel].color);
        }
        
        updateUI();
        updateToolAdLabels(); // <--- 合并后立即刷新道具角标
        
        // 合并后检查游戏状态
        setTimeout(() => {
            const newFruit = findFruitByRowCol(lastFruit.row, lastFruit.col);
            if (newFruit) checkMerges(newFruit);
            checkGameTarget();
        }, 300);
    }, 300);
}

function checkMerges(fruit) {
    const groups = getMergeGroups(fruit);
    mergeFruitsGroups(groups);
}

// 显示得分弹出动画
function showScorePopup(x, y, points) {
    const popup = document.createElement('div');
    popup.className = 'fixed text-white font-bold text-xl z-50';
    // 修正为相对于游戏容器定位
    const container = document.querySelector('.game-grid-container');
    const rect = container.getBoundingClientRect();
    popup.style.left = `${x + rect.left + window.scrollX}px`;
    popup.style.top = `${y + rect.top + window.scrollY}px`;
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.animation = 'scorePopup 1.5s forwards';
    popup.textContent = `+${points}`;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 1500);
}

// 添加得分弹出动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes scorePopup {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -150%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -200%) scale(0.8); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ------------------ 其他功能 ------------------
function removeFruit(id) {
    const idx = gameState.fruits.findIndex(f => f.id === id);
    if (idx === -1) return;
    const fruit = gameState.fruits[idx];
    
    if (fruit.gridPoint) fruit.gridPoint.occupied = false;
    
    // 添加移除动画
    if (fruit.element) {
        fruit.element.style.transition = 'all 0.2s';
        fruit.element.style.transform = 'scale(0.5)';
        fruit.element.style.opacity = '0';
        
        setTimeout(() => {
            fruit.element?.remove();
        }, 200);
    }
    
    gameState.fruits.splice(idx, 1);
}

function showMergeEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.className = 'merge-pulse fixed rounded-full pointer-events-none z-10';
    // 修正为相对于游戏容器定位
    const container = document.querySelector('.game-grid-container');
    const rect = container.getBoundingClientRect();
    effect.style.left = `${x + rect.left + window.scrollX}px`;
    effect.style.top = `${y + rect.top + window.scrollY}px`;
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.width = '120px';
    effect.style.height = '120px';
    effect.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;

    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 800);
}

function showToolEffect(icon, x, y) {
    const effect = document.createElement('div');
    effect.className = 'tool-fly fixed text-2xl z-100';
    // 修正为相对于游戏容器定位
    const container = document.querySelector('.game-grid-container');
    const rect = container.getBoundingClientRect();
    effect.style.left = `${x + rect.left + window.scrollX}px`;
    effect.style.top = `${y + rect.top + window.scrollY}px`;
    effect.style.transform = 'translate(-50%, -50%)';
    effect.textContent = icon;

    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 1000);
}

// 新增无确认提示（底部浮动）
function showToast(message) {
    const container = document.getElementById('toast-container');
    
    // 清空现有提示
    container.innerHTML = '';
    
    const toast = document.createElement('div');
    toast.className = 'toast-fade bg-black/75 text-white py-2 px-4 rounded-full text-sm font-bold shadow-lg';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// ------------------ 道具系统 ------------------
// 选中道具
// 选中道具
function selectTool(e) {
    if (!gameState.gameActive) return;
    const tool = e.currentTarget.dataset.tool;

    // 每关只能用一次
    if (gameState.toolUsage[tool] > 0) {
        showToast('本关该道具已用过');
        return;
    }

    // 免费和广告次数判断
    if (gameState.dailyToolFreeUsed[tool] && gameState.toolAdUsed[tool]) {
        showToast('今日免费和广告次数已用完');
        return;
    }

    // 取消所有道具选中状态
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active-tool'));

    // 自动执行型道具
    if (tool === 'freeze' || tool === 'addSteps') {
        if (canUseToolForFree(tool)) {
            gameState.dailyToolFreeUsed[tool] = true;
            saveDailyFreeToolUsage();
        } else if (canUseToolByAd(tool)) {
            if (!confirm('观看广告可继续使用该道具')) {
                return;
            }
            gameState.toolAdUsed[tool] = true;
        } else {
            showToast('今日免费和广告次数已用完');
            return;
        }
        gameState.toolUsage[tool]++;
        if (tool === 'freeze') {
            useFreeze();
        } else if (tool === 'addSteps') {
            useAddSteps();
        }
        updateToolAdLabels();
        updateUI(); // 更新UI显示
        return;
    }

    // 其它道具：选中后高亮
    gameState.selectedTool = tool;
    e.currentTarget.classList.add('active-tool');
}

// 判断本次道具是否免费
function canUseToolForFree(tool) {
    return !gameState.dailyToolFreeUsed[tool];
}

// 判断本次道具是否可广告
function canUseToolByAd(tool) {
    return gameState.dailyToolFreeUsed[tool] && !gameState.toolAdUsed[tool];
}

// 选中水果凸显样式
function useToolOnFruit(fruit) {
    const tool = gameState.selectedTool;
    if (!tool) return;

    if (gameState.toolUsage[tool] > 0) {
        showToast('本关该道具已用过');
        resetToolSelect();
        return;
    }

    if (canUseToolForFree(tool)) {
        gameState.dailyToolFreeUsed[tool] = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd(tool)) {
        if (!confirm('观看广告可继续使用该道具')) {
            resetToolSelect();
            return;
        }
        gameState.toolAdUsed[tool] = true;
    } else {
        showToast('今日免费和广告次数已用完');
        resetToolSelect();
        return;
    }

    gameState.toolUsage[tool]++;

    // 选中水果凸显
    document.querySelectorAll('.fruit').forEach(f => f.classList.remove('selected'));
    if (fruit.element) fruit.element.classList.add('selected');

    switch (tool) {
        case 'hammer':
            useHammer(fruit);
            break;
        case 'swap':
            useSwap(fruit);
            break;
        case 'bomb':
            useBomb(fruit);
            break;
    }

    resetToolSelect();
    updateToolAdLabels();
}

// 取消道具选择
function resetToolSelect() {
    gameState.selectedTool = null;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active-tool'));
    document.querySelectorAll('.fruit.selected').forEach(f => f.classList.remove('selected'));
    document.querySelectorAll('.game-grid > div').forEach(cell => cell.classList.remove('selected-cell'));
    swapFirstTarget = null;
}

// 修正锤子道具
function useHammer(target) {
    if (gameState.toolUsage.hammer > 0) {
        showToast('本关该道具已用过');
        resetToolSelect();
        return;
    }
    if (!canUseToolForFree('hammer') && !canUseToolByAd('hammer')) {
        showToast('今日免费和广告次数已用完');
        resetToolSelect();
        return;
    }
    let fruit = target.isCell ? findFruitByRowCol(target.row, target.col) : target;
    if (!fruit) {
        showToast('请选择有水果的格子或水果');
        resetToolSelect();
        return;
    }
    // 免费/广告判断
    if (canUseToolForFree('hammer')) {
        gameState.dailyToolFreeUsed.hammer = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd('hammer')) {
        gameState.toolAdUsed.hammer = true;
    }
    gameState.toolUsage.hammer++;
    removeFruit(fruit.id);
    showToolEffect('🔨', fruit.x, fruit.y);
    updateUI();
    updateToolAdLabels();
    resetToolSelect();
}

// 新版交换道具：可选任意两个水果或格子（有水果才可交换）
function useSwap(target) {
    if (gameState.toolUsage.swap > 0) {
        showToast('本关该道具已用过');
        resetToolSelect();
        swapFirstTarget = null;
        return;
    }
    if (!canUseToolForFree('swap') && !canUseToolByAd('swap')) {
        showToast('今日免费和广告次数已用完');
        resetToolSelect();
        swapFirstTarget = null;
        return;
    }
    let fruit = target.isCell ? findFruitByRowCol(target.row, target.col) : target;
    if (!fruit) {
        showToast('请选择有水果的格子或水果');
        resetToolSelect();
        swapFirstTarget = null;
        return;
    }
    // 免费/广告判断
    if (canUseToolForFree('swap')) {
        gameState.dailyToolFreeUsed.swap = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd('swap')) {
        gameState.toolAdUsed.swap = true;
    }
    gameState.toolUsage.swap++;

    // 交换逻辑
    const firstFruit = swapFirstTarget;
    const secondFruit = fruit;
    const tempRow = firstFruit.row;
    const tempCol = firstFruit.col;
    const tempGridPoint = firstFruit.gridPoint;

    firstFruit.row = secondFruit.row;
    firstFruit.col = secondFruit.col;
    firstFruit.gridPoint = secondFruit.gridPoint;

    secondFruit.row = tempRow;
    secondFruit.col = tempCol;
    secondFruit.gridPoint = tempGridPoint;

    const theme = gameState.themes[gameState.currentTheme];
    const firstFruitData = theme.fruits[firstFruit.level];
    const secondFruitData = theme.fruits[secondFruit.level];

    firstFruit.element.style.transition = 'all 0.4s';
    secondFruit.element.style.transition = 'all 0.4s';
    firstFruit.element.style.left = `${firstFruit.gridPoint.x - firstFruitData.size / 2}px`;
    firstFruit.element.style.top = `${firstFruit.gridPoint.y - firstFruitData.size / 2}px`;
    secondFruit.element.style.left = `${secondFruit.gridPoint.x - secondFruitData.size / 2}px`;
    secondFruit.element.style.top = `${secondFruit.gridPoint.y - secondFruitData.size / 2}px`;

    setTimeout(() => {
        firstFruit.element.classList.remove('selected');
        swapFirstTarget = null;
        showToolEffect('🔄', (firstFruit.x + secondFruit.x) / 2, (firstFruit.y + secondFruit.y) / 2);
        setTimeout(() => {
            checkMerges(firstFruit);
            checkMerges(secondFruit);
            checkGameTarget();
        }, 400);
        updateUI();
        updateToolAdLabels();
        resetToolSelect();
    }, 400);
}


// 随机道具：打乱棋盘所有水果内容
function useFreeze() {
    if (gameState.fruits.length <= 1) {
        showToast('棋盘水果太少，无法打乱');
        return;
    }
    if (gameState.toolUsage.freeze > 0) {
        showToast('本关该道具已用过');
        return;
    }
    if (!canUseToolForFree('freeze') && !canUseToolByAd('freeze')) {
        showToast('今日免费和广告次数已用完');
        return;
    }
    // 免费/广告判断
    if (canUseToolForFree('freeze')) {
        gameState.dailyToolFreeUsed.freeze = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd('freeze')) {
        gameState.toolAdUsed.freeze = true;
    }
    gameState.toolUsage.freeze++;

    // 记录所有水果的level
    const levels = gameState.fruits.map(f => f.level);
    // 洗牌
    for (let i = levels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [levels[i], levels[j]] = [levels[j], levels[i]];
    }
    // 重新分配level
    gameState.fruits.forEach((f, idx) => {
        f.level = levels[idx];
        const fruitData = gameState.themes[gameState.currentTheme].fruits[f.level];
        f.element.textContent = fruitData.emoji;
        f.element.style.backgroundColor = fruitData.color;
        f.element.style.fontSize = `${fruitData.size}px`;
        f.element.style.width = `${fruitData.size * 1.2}px`;
        f.element.style.height = `${fruitData.size * 1.2}px`;
    });
    // 动画提示
    showToolEffect('🔀', gameState.gridSize * 4, gameState.gridSize * 4);
    // 检查合并和输赢
    setTimeout(() => {
        // 检查所有水果是否有合并
        gameState.fruits.forEach(f => checkMerges(f));
        checkGameTarget();
    }, 400);
}

// 新版炸弹道具：可点任意有水果的格子或水果，爆炸3x3
function useBomb(target) {
    if (gameState.toolUsage.bomb > 0) {
        showToast('本关该道具已用过');
        resetToolSelect();
        return;
    }
    if (!canUseToolForFree('bomb') && !canUseToolByAd('bomb')) {
        showToast('今日免费和广告次数已用完');
        resetToolSelect();
        return;
    }
    let fruit = target.isCell ? findFruitByRowCol(target.row, target.col) : target;
    if (!fruit) {
        showToast('请选择有水果的格子或水果');
        resetToolSelect();
        return;
    }
    // 免费/广告判断
    if (canUseToolForFree('bomb')) {
        gameState.dailyToolFreeUsed.bomb = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd('bomb')) {
        gameState.toolAdUsed.bomb = true;
    }
    gameState.toolUsage.bomb++;

    showToolEffect('💥', fruit.x, fruit.y);

    const range = 1;
    const startRow = Math.max(0, fruit.row - range);
    const endRow = Math.min(gameState.gridRows - 1, fruit.row + range);
    const startCol = Math.max(0, fruit.col - range);
    const endCol = Math.min(gameState.gridCols - 1, fruit.col + range);

    let pointsEarned = 0;
    const theme = gameState.themes[gameState.currentTheme];

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const f = findFruitByRowCol(r, c);
            if (f && f.element) {
                f.element.style.transition = 'all 0.3s';
                f.element.style.transform = 'scale(1.3)';
                f.element.style.opacity = '0';
            }
        }
    }

    setTimeout(() => {
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const f = findFruitByRowCol(r, c);
                if (f) {
                    pointsEarned += theme.fruits[f.level].points / 2;
                    removeFruit(f.id);
                }
            }
        }
        if (pointsEarned > 0) {
            gameState.score += pointsEarned;
            showScorePopup(fruit.x, fruit.y, pointsEarned);
        }
        updateUI();
        updateToolAdLabels();
        resetToolSelect();
        checkGameTarget();
    }, 300);
}

// 增加步数道具
function useAddSteps() {
    if (gameState.toolUsage.addSteps > 0) {
        showToast('本关该道具已用过');
        return;
    }
    if (!canUseToolForFree('addSteps') && !canUseToolByAd('addSteps')) {
        showToast('今日免费和广告次数已用完');
        return;
    }
    // 免费/广告判断
    if (canUseToolForFree('addSteps')) {
        gameState.dailyToolFreeUsed.addSteps = true;
        saveDailyFreeToolUsage();
    } else if (canUseToolByAd('addSteps')) {
        gameState.toolAdUsed.addSteps = true;
    }
    gameState.toolUsage.addSteps++;

    const stepsAdded = 5;
    gameState.steps += stepsAdded;

    showToolEffect('+5', 50, 50);
    showToast(`增加了${stepsAdded}步！`);

    updateUI();
    checkGameTarget();
}


// ------------------ 宠物技能 ------------------
function usePetSkill() {
    if (gameState.petSkillUsed) {
        showToast('宠物技能已在本关使用过');
        return;
    }
    
    // 宠物技能必须看广告
    if (confirm('观看广告可使用宠物技能，随机清除3个水果')) {
        gameState.petSkillUsed = true;
        gameState.petSkillAdUsed = true;
        updatePetSkillAD();
        
        const fruits = [...gameState.fruits];
        if (fruits.length >= 3) {
            const toRemove = [];
            while (toRemove.length < 3 && fruits.length > 0) {
                const randomIndex = Math.floor(Math.random() * fruits.length);
                toRemove.push(fruits[randomIndex]);
                fruits.splice(randomIndex, 1);
            }
            
            // 添加动画效果
            toRemove.forEach(fruit => {
                if (fruit.element) {
                    fruit.element.style.transition = 'all 0.3s';
                    fruit.element.style.transform = 'scale(1.2)';
                    fruit.element.style.opacity = '0';
                }
            });
            
            setTimeout(() => {
                toRemove.forEach(fruit => {
                    removeFruit(fruit.id);
                    showToolEffect('🐾', fruit.x, fruit.y);
                });
                
                updateUI();
                checkGameTarget();
            }, 300);
        } else {
            showToast('棋盘上水果不足，无法使用宠物技能');
        }
    }
}

// 更新宠物广告状态
function updatePetSkillAD() {
    const petAdLabel = document.getElementById('petAdLabel');
    if (gameState.petSkillAdUsed) {
        petAdLabel.classList.add('hidden');
    }
}

// 更新道具广告标注
function updateToolAdLabels() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        const tool = btn.dataset.tool;
        const countEl = btn.querySelector('.tool-count');      // 右上角数量角标
        const adLabel = btn.querySelector('.tool-ad-label');   // 右下角状态角标

        if (canUseToolForFree(tool)) {
            // 有免费次数时，右上角显示为1，右下角显示“免费”
            countEl.textContent = '1';
            countEl.dataset.count = '1';
            adLabel.textContent = '免费';
            adLabel.classList.remove('hidden');
            btn.classList.remove('used', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
        } else if (canUseToolByAd(tool)) {
            // 每天的免费次数用完后，没有免费次数的道具，右上角显示为0，右下角显示“AD”
            countEl.textContent = '0';
            countEl.dataset.count = '0';
            adLabel.textContent = 'AD';
            adLabel.classList.remove('hidden');
            btn.classList.remove('used', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
        } else if (gameState.toolUsage[tool] > 0) {
            // 使用完了看广告得到的道具的次数，则道具右上角显示为0，右下角显示“已用”
            countEl.textContent = '0';
            countEl.dataset.count = '0';
            adLabel.textContent = '已用';
            adLabel.classList.remove('hidden');
            btn.classList.add('used', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = true;
        } else if (gameState.toolAdUsed[tool]) {
            // 成功看完广告后，右上角角标更新为1，右下角还是“AD”
            countEl.textContent = '1';
            countEl.dataset.count = '1';
            adLabel.textContent = 'AD';
            adLabel.classList.remove('hidden');
            btn.classList.remove('used', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
        } else {
            adLabel.classList.add('hidden');
            btn.classList.remove('used', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
        }
    });
}

// --- 新关卡/新局时重置道具按钮状态 ---
function resetToolBtnStatus() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('used', 'opacity-50', 'cursor-not-allowed', 'active-tool');
        btn.disabled = false;
    });
    // 重置本关道具使用记录
    gameState.toolUsage = {
        hammer: 0,
        swap: 0,
        freeze: 0,
        bomb: 0,
        addSteps: 0
    };
    // 重置广告使用记录
    gameState.toolAdUsed = {
        hammer: false,
        swap: false,
        freeze: false,
        bomb: false,
        addSteps: false
    };
    updateToolAdLabels();
}

// 新关卡开始时检查道具免费次数
function checkToolFreeUsageOnNewLevel() {
    const tools = ['hammer', 'swap', 'freeze', 'bomb', 'addSteps'];
    tools.forEach(tool => {
        if (canUseToolForFree(tool)) {
            showToast(`本关${tool}道具可免费使用一次`);
        } else if (canUseToolByAd(tool)) {
            showToast(`本关${tool}道具可通过观看广告使用一次`);
        }
    });
}


// ------------------ 游戏流程控制 ------------------
function dropFruitOnGrid(e) {
    if (!gameState.gameActive) return;

    if (e.type === 'touchstart') {
        e.preventDefault();
        e.clientX = e.touches[0].clientX;
        e.clientY = e.touches[0].clientY;
    }

    if (gameState.isPetDragging) return;

    // 如果选中了道具
    if (gameState.selectedTool) {
        // 优先判断是否点击了水果
        let fruitEl = e.target.closest('.fruit');
        if (fruitEl) {
            const fruitId = fruitEl.dataset.id;
            const fruit = gameState.fruits.find(f => f.id == fruitId);
            if (fruit) {
                useToolOnTarget(fruit); // 新函数，统一处理道具
                return;
            }
        }
        // 如果点的是格子
        let cell = e.target.closest('.game-grid > div');
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const gridPoint = getGridPointByRowCol(row, col);
            useToolOnTarget({ row, col, gridPoint, isCell: true });
            return;
        }
        return;
    }

    // 正常落子逻辑
    if (gameState.nextFruit === null) return;

    const cell = e.target.closest('.game-grid > div');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const gridPoint = getGridPointByRowCol(row, col);
    if (!gridPoint || gridPoint.occupied) {
        showToast('此位置已被占用');
        return;
    }

    addFruitAtGrid(row, col, gameState.nextFruit);
    gameState.steps--;
    generateNextFruit();
    updateUI();
    updateToolAdLabels();
    checkGameTarget();
}

// 统一处理道具目标（水果或格子）
function useToolOnTarget(target) {
    const tool = gameState.selectedTool;
    if (!tool) return;

    // 1.道具按钮凸出显示
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.dataset.tool === tool) {
            btn.classList.add('active-tool');
        } else {
            btn.classList.remove('active-tool');
        }
    });

    // 2.清除所有高亮
    document.querySelectorAll('.fruit').forEach(f => f.classList.remove('selected'));
    document.querySelectorAll('.game-grid > div').forEach(cell => cell.classList.remove('selected-cell'));

    // 3.高亮当前目标并增加提示
    if (target.isCell) {
        const cell = document.querySelector(`.game-grid > div[data-row="${target.row}"][data-col="${target.col}"]`);
        if (cell) {
            cell.classList.add('selected-cell');
            showToast('已选中格子，执行道具效果');
        }
    } else if (target.element) {
        target.element.classList.add('selected');
        showToast('已选中水果，执行道具效果');
    }

    // 4.执行道具逻辑
    switch (tool) {
        case 'hammer':
            useHammer(target);
            break;
        case 'swap':
            useSwap(target);
            break;
        case 'bomb':
            useBomb(target);
            break;
    }
    // 角标刷新在各道具内部已处理
}

function checkGameTarget() {
    // 检查是否达到关卡目标
    if (gameState.watermelonCount >= gameState.targetWatermelon) {
        gameState.gameActive = false;

        // 显示关卡完成弹窗
        document.getElementById('modalTitle').textContent = '恭喜过关！';
        document.getElementById('modalMessage').textContent = '你成功合成了大西瓜！';
        document.getElementById('nextLevelBtn').classList.remove('hidden');
        document.getElementById('restartBtn').classList.remove('hidden');
        document.getElementById('reviveBtn').classList.add('hidden');
        document.getElementById('continueBtn').classList.add('hidden');

        showGameOver();
        return;
    }

    // 检查是否没有步数
    if (gameState.steps <= 0) {
        gameState.gameActive = false;

        // 显示游戏结束弹窗
        document.getElementById('modalTitle').textContent = '步数用完！';
        document.getElementById('modalMessage').textContent = '再接再厉！';

        if (!gameState.hasRevived && gameState.score > 100) {
            document.getElementById('reviveBtn').classList.remove('hidden');
        } else {
            document.getElementById('reviveBtn').classList.add('hidden');
        }

        document.getElementById('restartBtn').classList.remove('hidden');
        document.getElementById('nextLevelBtn').classList.add('hidden');
        document.getElementById('continueBtn').classList.add('hidden');

        showGameOver();
        return;
    }

    // 检查是否无法继续游戏（没有空位）
    const hasEmptySpace = gameState.gridPoints.some(p => !p.occupied);
    if (!hasEmptySpace) {
        gameState.gameActive = false;

        // 显示游戏结束弹窗
        document.getElementById('modalTitle').textContent = '棋盘已满！';
        document.getElementById('modalMessage').textContent = '尝试使用道具或重新开始！';

        if (!gameState.hasRevived && gameState.score > 100) {
            document.getElementById('reviveBtn').classList.remove('hidden');
        } else {
            document.getElementById('reviveBtn').classList.add('hidden');
        }

        document.getElementById('restartBtn').classList.remove('hidden');
        document.getElementById('nextLevelBtn').classList.add('hidden');
        document.getElementById('continueBtn').classList.add('hidden');

        showGameOver();
    }
}

function showGameOver() {
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('finalSteps').textContent = gameState.steps;
    
    // 确保弹窗显示在水果上方
    const overlay = document.getElementById('gameOverlay');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.style.zIndex = '100';
    
    const modal = document.querySelector('.game-modal');
    modal.style.transform = 'scale(1)';
    modal.style.zIndex = '101';
}

function hideGameOver() {
    const overlay = document.getElementById('gameOverlay');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '-1';
    
    const modal = document.querySelector('.game-modal');
    modal.style.transform = 'scale(0.8)';
    modal.style.zIndex = '-1';
}

function nextLevel() {
    gameState.level++;
    gameState.steps = gameState.maxSteps + (gameState.level - 1) * 10;
    gameState.watermelonCount = 0;
    gameState.fruits.forEach(f => f.element?.remove());
    gameState.fruits = [];
    gameState.gridPoints.forEach(p => p.occupied = false);

    // 重置本关道具使用记录
    gameState.toolUsage = {
        hammer: 0,
        swap: 0,
        freeze: 0,
        bomb: 0,
        addSteps: 0
    };

    gameState.petSkillUsed = false;

    // 每关奖励道具
    gameState.tools.hammer++;
    gameState.tools.swap++;
    gameState.tools.freeze++;
    gameState.tools.bomb++; // 每关都加炸弹

    // 新增：随机放置水果
    randomlyPlaceFruits();

    generateNextFruit();
    updateUI();
    updateToolAdLabels();
    resetToolBtnStatus();
    checkToolFreeUsageOnNewLevel(); // 检查道具免费次数
    hideGameOver();
    gameState.gameActive = true;
}


function randomlyPlaceFruits() {
    // 计算要随机放置水果的格子数量范围（调整为30%-50%）
    const minCount = Math.floor(gameState.totalGridPoints * 0.3);
    const maxCount = Math.floor(gameState.totalGridPoints * 0.5);
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

    const availableGridPoints = gameState.gridPoints.filter(p => !p.occupied);
    const shuffledGridPoints = availableGridPoints.sort(() => Math.random() - 0.5);
    const selectedGridPoints = shuffledGridPoints.slice(0, count);

    selectedGridPoints.forEach(gridPoint => {
        const randomLevel = gameState.randomFruitLevels[Math.floor(Math.random() * gameState.randomFruitLevels.length)];
        addFruitAtGrid(gridPoint.row, gridPoint.col, randomLevel);
    });
}

// 重新开始游戏
function restartGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.steps = gameState.maxSteps;
    gameState.watermelonCount = 0;
    gameState.hasRevived = false;
    gameState.petSkillUsed = false;

    // 重置道具
    gameState.tools = {
        hammer: 1,
        swap: 1,
        freeze: 1,
        bomb: 1, // 初始就有炸弹
        addSteps: 1
    };

    gameState.toolUsage = {
        hammer: 0,
        swap: 0,
        freeze: 0,
        bomb: 0,
        addSteps: 0
    };

    gameState.fruits.forEach(f => f.element?.remove());
    gameState.fruits = [];
    gameState.gridPoints.forEach(p => p.occupied = false);

    // 新增：随机放置水果
    randomlyPlaceFruits();

    generateNextFruit();
    updateUI();
    updateToolAdLabels();
    resetToolBtnStatus();
    checkToolFreeUsageOnNewLevel(); // 检查道具免费次数
    hideGameOver();
    gameState.gameActive = true;
}

function reviveGame() {
    // 在现有步数基础上增加 15 步
    gameState.steps += 15;
    gameState.hasRevived = true;
    hideGameOver();
    gameState.gameActive = true;
    
    // 打乱棋盘内容（使用类似 freeze 道具的逻辑）
    if (gameState.fruits.length > 1) {
        // 记录所有水果的 level
        const levels = gameState.fruits.map(f => f.level);
        // 洗牌
        for (let i = levels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [levels[i], levels[j]] = [levels[j], levels[i]];
        }
        // 重新分配 level
        gameState.fruits.forEach((f, idx) => {
            f.level = levels[idx];
            const fruitData = gameState.themes[gameState.currentTheme].fruits[f.level];
            f.element.textContent = fruitData.emoji;
            f.element.style.backgroundColor = fruitData.color;
            f.element.style.fontSize = `${fruitData.size}px`;
            f.element.style.width = `${fruitData.size * 1.2}px`;
            f.element.style.height = `${fruitData.size * 1.2}px`;
        });
        // 动画提示
        showToolEffect('🔄', gameState.gridSize * 4, gameState.gridSize * 4);
        
        // 延迟检查合并，确保动画完成
        setTimeout(() => {
            // 检查所有水果是否有合并
            let merged = false;
            gameState.fruits.forEach(f => {
                if (checkMerges(f)) merged = true;
            });
            
            // 合并后再延迟检查输赢，给UI更新时间
            setTimeout(() => {
                checkGameTarget(); // 检查游戏目标和胜负条件
            }, merged ? 5000 : 3000); // 如果有合并，等待更长时间
            
        }, 500); // 等待打乱动画完成
    }
    
    updateUI(); // 更新 UI 以显示新的步数和棋盘状态

    // 更新道具可用次数
    updateToolAdLabels();
}

// ------------------ 主题切换 ------------------
function switchTheme(e) {
    const theme = e.currentTarget.dataset.theme;
    if (theme === gameState.currentTheme) return;
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('border-white');
        btn.classList.add('border-transparent');
    });
    
    e.currentTarget.classList.add('active');
    e.currentTarget.classList.remove('border-transparent');
    e.currentTarget.classList.add('border-white');
    
    gameState.currentTheme = theme;
    updateThemeStyles();
    
    // 更新所有水果的外观
    gameState.fruits.forEach(fruit => {
        const fruitData = gameState.themes[theme].fruits[fruit.level];
        fruit.element.textContent = fruitData.emoji;
        fruit.element.style.backgroundColor = fruitData.color;
        fruit.element.style.fontSize = `${fruitData.size}px`;
        fruit.element.style.width = `${fruitData.size * 1.2}px`;
        fruit.element.style.height = `${fruitData.size * 1.2}px`;
        fruit.element.style.left = `${fruit.x - fruitData.size / 2}px`;
        fruit.element.style.top = `${fruit.y - fruitData.size / 2}px`;
    });
    
    // 更新下一个水果的外观
    const nextFruitEl = document.getElementById('nextFruit');
    const nextFruitData = gameState.themes[theme].fruits[gameState.nextFruit];
    nextFruitEl.textContent = nextFruitData.emoji;
    nextFruitEl.style.background = nextFruitData.color;
}

function updateThemeStyles() {
    const theme = gameState.themes[gameState.currentTheme];
    document.querySelector('.game-grid-container').style.backgroundColor = theme.background;
    
    // 更新网格线样式
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid) {
        gameGrid.style.background = `linear-gradient(${theme.grid} 1px, transparent 1px),
                                     linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`;
        gameGrid.style.backgroundSize = '12.5% 12.5%';
    }
}

// ------------------ 每日免费道具使用记录 ------------------
function saveDailyFreeToolUsage() {
    try {
        localStorage.setItem('dailyToolFreeUsed', JSON.stringify(gameState.dailyToolFreeUsed));
        localStorage.setItem('dailyToolDate', new Date().toDateString());
    } catch (e) {
        console.error('Failed to save daily tool usage:', e);
    }
}

function loadDailyFreeToolUsage() {
    try {
        const saved = localStorage.getItem('dailyToolFreeUsed');
        const savedDate = localStorage.getItem('dailyToolDate');
        const today = new Date().toDateString();
        
        if (saved && savedDate === today) {
            Object.assign(gameState.dailyToolFreeUsed, JSON.parse(saved));
        } else {
            // 新的一天，重置免费道具使用记录
            gameState.dailyToolFreeUsed = {
                hammer: false,
                swap: false,
                freeze: false,
                bomb: false,
                addSteps: false
            };
            localStorage.setItem('dailyToolDate', today);
        }
    } catch (e) {
        console.error('Failed to load daily tool usage:', e);
        // 出错时重置免费道具使用记录
        gameState.dailyToolFreeUsed = {
            hammer: false,
            swap: false,
            freeze: false,
            bomb: false,
            addSteps: false
        };
    }
}

// ------------------ 更新UI ------------------
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('steps').textContent = gameState.steps;
    document.getElementById('targetCount').textContent = `${gameState.watermelonCount}/${gameState.targetWatermelon}`;

    // 只更新右上角数量角标
    document.querySelectorAll('.tool-btn').forEach(btn => {
        const tool = btn.dataset.tool;
        const countEl = btn.querySelector('.tool-count');
        countEl.textContent = gameState.tools[tool];
        countEl.dataset.count = gameState.tools[tool];
    });
}

// ------------------ 初始化游戏 ------------------
function initGame() {
    createGrid();
    loadDailyFreeToolUsage();
    randomlyPlaceFruits();
    generateNextFruit();
    updateUI();
    updateToolAdLabels(); // 确保一开始就显示角标

    // 添加事件监听
    document.querySelector('.game-grid').addEventListener('click', dropFruitOnGrid);
    document.querySelector('.game-grid').addEventListener('touchstart', dropFruitOnGrid, { passive: true });

    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', selectTool);
    });

    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('reviveBtn').addEventListener('click', reviveGame);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', switchTheme);
    });

    // 窗口大小变化时重新计算网格
    window.addEventListener('resize', () => {
        // 获取游戏容器的位置信息
        const gameArea = document.querySelector('.game-grid-container');
        const gameAreaRect = gameArea.getBoundingClientRect();
        gameState.gameAreaOffset = {
            left: gameAreaRect.left,
            top: gameAreaRect.top
        };

        createGrid();
        // 重新定位现有水果
        gameState.fruits.forEach(fruit => {
            const fruitData = gameState.themes[gameState.currentTheme].fruits[fruit.level];
            if (fruit.element) {
                fruit.element.style.left = `${fruit.x - fruitData.size / 2}px`;
                fruit.element.style.top = `${fruit.y - fruitData.size / 2}px`;
            }
        });
    });

    // 游戏开始
    gameState.gameActive = true;

    // 显示欢迎提示
    setTimeout(() => {
        showToast("欢迎来到水果合成游戏！");
    }, 500);
}

// 启动游戏
window.addEventListener('load', initGame);