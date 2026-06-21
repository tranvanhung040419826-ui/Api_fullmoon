const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo các biến lưu trữ
let totalExecute = 0;
let moonServers = new Map(); 

// Mã PlaceId của Sea 3
const SEA_3_PLACE_ID = "7449423635";

// 1. Cổng tiếp nhận dữ liệu (CHỈ NHẬN SEA 3)
app.post('/update-moon', (req, res) => {
    const { jobid, players, placeId } = req.body;
    
    if (!jobid) {
        return res.status(400).send("Thiếu JobId");
    }

    // Bộ lọc: Nếu không phải Sea 3 thì bỏ qua luôn
    if (String(placeId) !== SEA_3_PLACE_ID) {
        console.log(`⚠️ [Web] Từ chối Server do không phải Sea 3 (Place: ${placeId})`);
        return res.status(200).send("Bỏ qua vì không phải Sea 3");
    }

    totalExecute++; 

    // Lệnh Script Lua
    const teleportCommand = `game:GetService("ReplicatedStorage").__ServerBrowser:InvokeServer("teleport", "${jobid}")`;
    
    // Link JobId trực tiếp để mở game
    const jobLink = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${jobid}`;

    // Lưu dữ liệu theo đúng thứ tự yêu cầu: Link JobId -> Số người chơi -> Số người chạy Script
    moonServers.set(jobid, {
        "JobId_Link": jobLink,
        "Players": Number(players) || 1,
        "Script_Runners": totalExecute,
        "JobId_Raw": jobid,
        "PlaceId": Number(placeId),
        "Name": "Full Moon Sea 3",
        "Teleport_Command": teleportCommand,
        "UpdatedAt": Date.now()
    });

    console.log(`✅ [Web] Đã nạp Server Sea 3! JobId: ${jobid}`);
    res.status(200).send("Cập nhật thành công Server Sea 3!");
});

// 2. Cổng dành riêng cho Script Lua lấy dữ liệu về để Auto Hop
app.get('/api', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    res.json(moonDataArray);
});

// Cơ chế tự động xóa server khỏi danh sách sau 6 phút (Quét dọn mỗi 1 phút)
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of moonServers.entries()) {
        if (now - data.UpdatedAt > 6 * 60 * 1000) { 
            console.log(`🧹 [Web] Hết thời gian (6 phút), xóa Server cũ: ${jobid}`);
            moonServers.delete(jobid);
        }
    }
}, 60000); 

// 3. Giao diện hiển thị gốc trên Web
app.get('/', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    
    const finalData = {
        "Total_Execute_Global": totalExecute,
        "By": "tranduykhanh",
        "Sea_Filter": "Only Sea 3 (7449423635)",
        "Total_Moon_Servers": moonDataArray.length,
        "Moon_Data": moonDataArray
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Moon Server Tracker - Sea 3 Only</title>
        <style>
            body {
                background-color: #121212;
                color: #e0e0e0;
                font-family: monospace;
                padding: 15px;
                margin: 0;
            }
            .controls {
                margin-bottom: 10px;
                font-size: 14px;
                user-select: none;
            }
            pre {
                background-color: #181818;
                padding: 10px;
                border-radius: 4px;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 13px;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="controls">
            <label>
                <input type="checkbox" id="prettyPrint" checked onchange="renderJSON()"> Tạo bản in đẹp
            </label>
        </div>
        <pre id="jsonContent"></pre>

        <script>
            const rawData = ${JSON.stringify(finalData)};
            
            function renderJSON() {
                const isPretty = document.getElementById('prettyPrint').checked;
                const container = document.getElementById('jsonContent');
                if (isPretty) {
                    container.textContent = JSON.stringify(rawData, null, 2);
                } else {
                    container.textContent = JSON.stringify(rawData);
                }
            }
            
            renderJSON();

            // Tự động làm mới trang sau mỗi 8 giây
            setTimeout(() => {
                location.reload();
            }, 8000);
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Web đang chạy tại port ${PORT} - CHỈ NHẬN DỮ LIỆU SEA 3`);
});

