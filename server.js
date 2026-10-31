const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // ป้องกันปัญหา Cross-Origin จากอุปกรณ์อื่น
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ตั้งค่าให้เปิดไฟล์หน้าเว็บจากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public'))); 

const dataFile = path.join(__dirname, 'data.json');

// ฟังก์ชันอ่านข้อมูลจากไฟล์ (ถ้าไม่มีไฟล์จะสร้างโครงสร้างพื้นฐาน)
function loadData() {
    if (fs.existsSync(dataFile)) {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    return { queues: [], totalCount: 0 };
}

// ฟังก์ชันบันทึกข้อมูลลงไฟล์ (ป้องกันข้อมูลหายเมื่อปิดโปรแกรม)
function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// API: ดึงข้อมูลคิวทั้งหมด
app.get('/api/queues', (req, res) => {
    res.json(loadData().queues);
});

// API: ลงทะเบียนคิวใหม่
app.post('/api/register', (req, res) => {
    const data = loadData();
    const { name, gunType, round } = req.body;

    data.totalCount += 1;
    const newQueue = {
        id: data.totalCount,
        name: name,
        gunType: gunType,
        round: round,
        status: 'รอเรียก'
    };
    
    data.queues.push(newQueue);
    saveData(data);

    // คำนวณคิวก่อนหน้า
    const waitingBefore = data.queues.filter(q => q.gunType === gunType && q.status === 'รอเรียก' && q.id < data.totalCount).length;

    res.json({ success: true, queue: newQueue, waitingBefore, totalCount: data.totalCount });
});

// API: อัปเดตสถานะคิว (เรียก / ข้าม)
app.put('/api/status', (req, res) => {
    const data = loadData();
    const { id, action } = req.body; // action = 'call' หรือ 'finish'
    
    const q = data.queues.find(item => item.id === id);
    if (q) {
        if (action === 'call') {
            q.status = (q.status === 'รอเรียก') ? 'กำลังยิง' : 'เสร็จสิ้น';
        } else if (action === 'finish') {
            q.status = 'เสร็จสิ้น';
        }
        saveData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// API: รีเซ็ตระบบ
app.post('/api/reset', (req, res) => {
    saveData({ queues: [], totalCount: 0 });
    res.json({ success: true });
});

// รันเซิร์ฟเวอร์ (0.0.0.0 เพื่อให้อุปกรณ์อื่นในวง Wi-Fi เข้ามาได้)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 เซิร์ฟเวอร์เริ่มทำงานแล้ว!`);
    console.log(`👉 เปิดหน้าจอแอดมิน (บนเครื่องนี้): http://localhost:${PORT}`);
    console.log(`📱 ลิงก์สำหรับมือถือสแกน: ใช้ IP วงแลนของเครื่องนี้ (เช่น http://192.168.x.x:${PORT})\n`);
});