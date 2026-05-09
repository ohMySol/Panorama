# Docker Setup для Panorama

## Development Mode

### Запустить весь проект одной командой:

```bash
docker-compose up
```

Или в фоновом режиме:

```bash
docker-compose up -d
```

### Остановить проект:

```bash
docker-compose down
```

### Пересобрать контейнеры:

```bash
docker-compose up --build
```

## Production Mode

### Запустить в production режиме:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Остановить production:

```bash
docker-compose -f docker-compose.prod.yml down
```

### Пересобрать production контейнеры:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Доступ к сервисам

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## Полезные команды

### Посмотреть логи:

```bash
# Все сервисы
docker-compose logs -f

# Только frontend
docker-compose logs -f frontend

# Только backend
docker-compose logs -f backend
```

### Перезапустить сервис:

```bash
docker-compose restart frontend
docker-compose restart backend
```

### Зайти в контейнер:

```bash
docker-compose exec frontend sh
docker-compose exec backend sh
```

### Остановить и удалить все (включая volumes):

```bash
docker-compose down -v
```

## Требования

- Docker
- Docker Compose

## Примечания

### Development:
- Hot reload работает для обоих сервисов
- Node modules монтируются как volumes для быстрой работы
- Frontend автоматически подключается к backend через docker network

### Production:
- Оптимизированные multi-stage builds
- Минимальный размер образов
- Автоматический перезапуск контейнеров
- Production-ready конфигурация
