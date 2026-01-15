# 🚀 Инструкция по установке 3DPrintHub на VDS сервер

## 📋 Требования к серверу

### Минимальные требования
- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: 4GB (рекомендуется 8GB+)
- **CPU**: 2 ядра (рекомендуется 4+)
- **Хранилище**: 50GB SSD
- **PHP**: 8.1+
- **Node.js**: 18.x+
- **PostgreSQL**: 15+
- **Redis**: 7+

### Рекомендуемые требования
- **ОС**: Ubuntu 22.04 LTS
- **RAM**: 8GB+
- **CPU**: 4+ ядер
- **Хранилище**: 100GB+ SSD

## 🔧 Подготовка сервера

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка необходимых пакетов
```bash
sudo apt install -y curl wget git unzip nginx certbot python3-certbot-nginx software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 3. Установка PHP 8.1+
```bash
# Добавление PPA репозитория
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Установка PHP и расширений
sudo apt install -y php8.1 php8.1-fpm php8.1-cli php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip php8.1-bcmath php8.1-intl php8.1-gd php8.1-pgsql php8.1-redis php8.1-dom php8.1-tokenizer php8.1-fileinfo php8.1-json

# Установка Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### 4. Установка Node.js 18+
```bash
# Добавление NodeSource репозитория
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
php -v
node -v
npm -v
composer -V
```

### 5. Установка PostgreSQL 15
```bash
# Добавление репозитория PostgreSQL
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/postgresql.gpg
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Настройка PostgreSQL
sudo -u postgres psql -c "CREATE USER 3dprinthub WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE 3dprinthub OWNER 3dprinthub;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE 3dprinthub TO 3dprinthub;"
```

### 6. Установка Redis
```bash
sudo apt install -y redis-server

# Настройка Redis
sudo nano /etc/redis/redis.conf
# Раскомментируйте и установите:
# bind 127.0.0.1
# requirepass your_redis_password

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

## 📂 Развертывание проекта

### 1. Клонирование репозитория
```bash
# Создание директории проекта
sudo mkdir -p /var/www/3dprinthub
sudo chown $USER:$USER /var/www/3dprinthub
cd /var/www/3dprinthub

# Клонирование проекта
git clone <repository-url> .
```

### 2. Настройка окружения Laravel
```bash
cd backend

# Копирование файла окружения
cp .env.example .env

# Генерация ключа
php artisan key:generate

# Редактирование .env файла
nano .env
```

### 3. Конфигурация .env файла
```env
APP_NAME="3DPrintHub"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=stack
LOG_LEVEL=error

# База данных
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=3dprinthub
DB_USERNAME=3dprinthub
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# Кэш и сессии
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Почта
MAIL_MAILER=smtp
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=587
MAIL_USERNAME=your-email@yandex.ru
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_FROM_NAME="${APP_NAME}"

# OAuth2 провайдеры
VKONTAKTE_CLIENT_ID=your_vk_client_id
VKONTAKTE_CLIENT_SECRET=your_vk_client_secret
VKONTAKTE_REDIRECT_URI=https://your-domain.com/auth/vk/callback

YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI=https://your-domain.com/auth/yandex/callback

# Платежные системы
TINKOFF_TERMINAL_KEY=your_tinkoff_terminal
TINKOFF_SECRET_KEY=your_tinkoff_secret
TINKOFF_DEMO=false

YOOKASSA_SHOP_ID=your_yookassa_shop_id
YOOKASSA_SECRET_KEY=your_yookassa_secret
YOOKASSA_DEMO=false

# Комиссии
COMMISSION_PHYSICAL=12
COMMISSION_DIGITAL=20

# Безопасность
JWT_SECRET=your_jwt_secret_key_here
SANCTUM_STATEFUL_DOMAINS=your-domain.com
```

### 4. Установка зависимостей и миграции
```bash
# Установка Laravel зависимостей
composer install --no-dev --optimize-autoloader

# Установка прав доступа
sudo chown -R www-data:www-data /var/www/3dprinthub/backend
sudo chmod -R 755 /var/www/3dprinthub/backend/storage
sudo chmod -R 755 /var/www/3dprinthub/backend/bootstrap/cache

# Запуск миграций
php artisan migrate --force

# Оптимизация
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Сборка фронтенда
```bash
cd ../frontend

# Установка зависимостей
npm install --production

# Сборка проекта
npm run build

# Возврат в корень
cd ..
```

### 6. Настройка symbolic link для storage
```bash
cd backend
php artisan storage:link
```

## 🌐 Настройка Nginx

### 1. Создание конфигурации Nginx
```bash
sudo nano /etc/nginx/sites-available/3dprinthub
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    root /var/www/3dprinthub/frontend/dist;
    index index.html index.php;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Безопасные заголовки
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Фронтенд (Vue.js SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # API бэкенда (Laravel)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Загрузка файлов
    location /storage/ {
        alias /var/www/3dprinthub/backend/storage/app/public/;
        access_log off;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Запрет доступа к скрытым файлам
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 2. Активация конфигурации
```bash
# Удаление стандартной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Активация конфигурации 3DPrintHub
sudo ln -s /etc/nginx/sites-available/3dprinthub /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL сертификат (Let's Encrypt)

### 1. Получение SSL сертификата
```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Проверка автопродления
sudo certbot renew --dry-run
```

### 2. Настройка автопродления
```bash
# Добавление в cron
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Настройка сервисов

### 1. Настройка PHP-FPM
```bash
sudo nano /etc/php/8.1/fpm/pool.d/www.conf
# Настройте параметры:
# pm = dynamic
# pm.max_children = 50
# pm.start_servers = 5
# pm.min_spare_servers = 5
# pm.max_spare_servers = 35
# pm.max_requests = 500

sudo systemctl restart php8.1-fpm
sudo systemctl enable php8.1-fpm
```

### 2. Создание systemd сервиса для Laravel
```bash
sudo nano /etc/systemd/system/3dprinthub.service
```

```ini
[Unit]
Description=3DPrintHub Laravel Application
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/3dprinthub/backend
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always
RestartSec=10
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Активация и запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable 3dprinthub
sudo systemctl start 3dprinthub

# Проверка статуса
sudo systemctl status 3dprinthub
```

### 3. Настройка очереди (опционально)
```bash
# Создание сервиса для очереди
sudo nano /etc/systemd/system/3dprinthub-queue.service
```

```ini
[Unit]
Description=3DPrintHub Queue Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/3dprinthub/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=10
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable 3dprinthub-queue
sudo systemctl start 3dprinthub-queue
```

## 🔧 Настройка бэкапов

### 1. Создание скрипта бэкапа
```bash
sudo nano /usr/local/bin/backup-3dprinthub.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/3dprinthub"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="3dprinthub"
DB_USER="3dprinthub"
PROJECT_DIR="/var/www/3dprinthub"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Бэкап файлов проекта
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $PROJECT_DIR backend/storage/app public/uploads

# Бэкап конфигурации
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $PROJECT_DIR backend/.env nginx/ ssl/

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Права доступа
chmod 600 $BACKUP_DIR/*

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-3dprinthub.sh
```

### 2. Настройка cron для бэкапов
```bash
sudo crontab -e
# Добавить строки:
0 2 * * * /usr/local/bin/backup-3dprinthub.sh
0 3 * * 0 /usr/bin/find /var/backups/3dprinthub -name "*.sql" -mtime +30 -delete
0 3 * * 0 /usr/bin/find /var/backups/3dprinthub -name "*.tar.gz" -mtime +30 -delete
```

## 🔍 Мониторинг и логи

### 1. Настройка логов
```bash
# Создание директории для логов
sudo mkdir -p /var/log/3dprinthub
sudo chown www-data:www-data /var/log/3dprinthub

# Настройка logrotate
sudo nano /etc/logrotate.d/3dprinthub
```

```
/var/log/3dprinthub/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload 3dprinthub
    endscript
}
```

### 2. Просмотр логов
```bash
# Логи приложения
sudo journalctl -u 3dprinthub -f

# Логи очереди
sudo journalctl -u 3dprinthub-queue -f

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи PHP-FPM
sudo tail -f /var/log/php8.1-fpm.log

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 🔄 Обновление проекта

### 1. Скрипт обновления
```bash
sudo nano /usr/local/bin/update-3dprinthub.sh
```

```bash
#!/bin/bash

PROJECT_DIR="/var/www/3dprinthub"
BACKUP_DIR="/var/backups/3dprinthub"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting update process..."

# Создание бэкапа перед обновлением
/usr/local/bin/backup-3dprinthub.sh

# Переход в директорию проекта
cd $PROJECT_DIR

# Получение обновлений
git pull origin main

# Обновление бэкенда
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Обновление фронтенда
cd ../frontend
npm install --production
npm run build

# Перезапуск сервисов
sudo systemctl restart 3dprinthub
sudo systemctl restart 3dprinthub-queue
sudo systemctl restart nginx

echo "Update completed successfully!"
```

```bash
sudo chmod +x /usr/local/bin/update-3dprinthub.sh
```

## ✅ Проверка работоспособности

### 1. Тестирование API
```bash
# Проверка health endpoint
curl -k https://your-domain.com/api/health

# Проверка API
curl -k https://your-domain.com/api/v1/products
```

### 2. Проверка фронтенда
- Откройте https://your-domain.com в браузере
- Проверьте загрузку всех страниц
- Проверьте работу API запросов

### 3. Проверка сервисов
```bash
# Статус всех сервисов
sudo systemctl status nginx php8.1-fpm postgresql redis-server 3dprinthub 3dprinthub-queue

# Проверка портов
sudo netstat -tlnp | grep -E ':(80|443|8000|5432|6379)'
```

## 🚨 Возможные проблемы и решения

### 1. Ошибка 502 Bad Gateway
```bash
# Проверка статуса PHP-FPM
sudo systemctl status php8.1-fpm

# Проверка сокета
sudo ls -la /var/run/php/php8.1-fpm.sock

# Перезапуск PHP-FPM
sudo systemctl restart php8.1-fpm
```

### 2. Ошибка подключения к БД
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Проверка подключения
sudo -u postgres psql -c "SELECT version();"

# Проверка пользователя БД
sudo -u postgres psql -c "\du"
```

### 3. Проблемы с правами доступа
```bash
# Исправление прав доступа
sudo chown -R www-data:www-data /var/www/3dprinthub/backend
sudo chmod -R 755 /var/www/3dprinthub/backend/storage
sudo chmod -R 755 /var/www/3dprinthub/backend/bootstrap/cache
```

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи всех сервисов
2. Права доступа к файлам
3. Конфигурацию .env файла
4. Доступность портов
5. Свободное место на диске

Для дополнительной поддержки обращайтесь:
- Email: support@3dprinthub.ru
- Telegram: @3dprinthub_support
