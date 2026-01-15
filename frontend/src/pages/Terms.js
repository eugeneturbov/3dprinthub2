import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  const currentDate = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Условия использования
        </h1>

        <div className="prose max-w-none">
          <p className="text-gray-600 mb-6">
            Добро пожаловать в 3DPrintHub. Эти Условия использования регулируют ваш доступ и использование нашей платформы. 
            Регистрируясь на 3DPrintHub, вы соглашаетесь соблюдать эти условия.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            1. Принятие условий
          </h2>

          <p className="text-gray-600 mb-4">
            Доступ к и использование 3DPrintHub регулируются этими Условиями использования. 
            Регистрируясь на платформе, вы подтверждаете, что прочитали, поняли и согласились соблюдать эти условия.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            2. Описание платформы
          </h2>

          <p className="text-gray-600 mb-4">
            3DPrintHub - это онлайн-маркетплейс, который соединяет продавцов и покупателей 3D-товаров, включая:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Цифровые 3D-модели и файлы для печати</li>
            <li>Физические 3D-напечатанные изделия</li>
            <li>Аксессуары и материалы для 3D-печати</li>
            <li>Связанные услуги и консультации</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            3. Регистрация и учетная запись
          </h2>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            3.1. Требования к регистрации
          </h3>
          <p className="text-gray-600 mb-4">
            Для регистрации на платформе вы должны:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Быть не моложе 18 лет</li>
            <li>Предоставить достоверную и актуальную информацию</li>
            <li>Создать надежный пароль и обеспечивать его конфиденциальность</li>
            <li>Иметь законное право использовать платформу в вашей юрисдикции</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            3.2. Ответственность за учетную запись
          </h3>
          <p className="text-gray-600 mb-6">
            Вы несете полную ответственность за все действия, совершенные под вашей учетной записью. 
            Вы обязаны немедленно уведомить нас о любом несанкционированном использовании вашей учетной записи.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            4. Правила для продавцов
          </h2>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            4.1. Требования к товарам
          </h3>
          <p className="text-gray-600 mb-4">
            Продавцы обязаны обеспечивать, что их товары:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Не нарушают авторские права и интеллектуальную собственность</li>
            <li>Соответствуют описанию и изображениям</li>
            <li>Не содержат вредоносного кода или вирусов</li>
            <li>Не являются незаконными или запрещенными</li>
            <li>Соответствуют техническим требованиям платформы</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            4.2. Запрещенные товары
          </h3>
          <p className="text-gray-600 mb-4">
            На платформе запрещено продавать:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Оружие и его компоненты</li>
            <li>Наркотические вещества и paraphernalia</li>
            <li>Контент для взрослых</li>
            <li>Поддельные товары и контрафакт</li>
            <li>Товары, нарушающие законы и моральные нормы</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            5. Правила для покупателей
          </h2>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            5.1. Обязанности покупателей
          </h3>
          <p className="text-gray-600 mb-4">
            Покупатели обязаны:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Предоставлять достоверную информацию для доставки</li>
            <li>Своевременно оплачивать заказы</li>
            <li>Не использовать товары в незаконных целях</li>
            <li>Соблюдать авторские права на цифровые товары</li>
            <li>Не злоупотреблять системой отзывов и оценок</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            6. Платежи и комиссии
          </h2>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            6.1. Комиссия платформы
          </h3>
          <p className="text-gray-600 mb-4">
            3DPrintHub взимает комиссию с продавцов за каждую успешную транзакцию:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Стандартная комиссия: 10% от суммы продажи</li>
            <li>Комиссия платежной системы: дополнительно 2-3%</li>
            <li>Для крупных продавцов действуют индивидуальные условия</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            6.2. Выплаты продавцам
          </h3>
          <p className="text-gray-600 mb-6">
            Выплаты продавцам производятся ежемесячно после удержания комиссии. 
            Минимальная сумма для вывода средств составляет 1000 рублей.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            7. Интеллектуальная собственность
          </h2>

          <p className="text-gray-600 mb-4">
            Все права на интеллектуальную собственность принадлежат их законным владельцам. 
            Платформа не передает права на интеллектуальную собственность, если это не указано явно.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            8. Возвраты и возмещения
          </h2>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            8.1. Цифровые товары
          </h3>
          <p className="text-gray-600 mb-6">
            Цифровые товары не подлежат возврату после скачивания, за исключением случаев, 
            когда товар не соответствует описанию или имеет дефекты.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3">
            8.2. Физические товары
          </h3>
          <p className="text-gray-600 mb-6">
            Физические товары можно вернуть в течение 14 дней после получения при условии сохранения оригинальной упаковки и товарного вида.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            9. Ограничение ответственности
          </h2>

          <p className="text-gray-600 mb-4">
            3DPrintHub не несет ответственности за:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Качество товаров, предоставляемых продавцами</li>
            <li>Прямые или косвенные убытки пользователей</li>
            <li>Действия третьих лиц</li>
            <li>Технические сбои и перерывы в работе платформы</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            10. Разрешение споров
          </h2>

          <p className="text-gray-600 mb-4">
            Все споры между пользователями решаются через систему медиации платформы. 
            Если согласие не достигнуто, споры решаются в соответствии с законодательством Российской Федерации.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            11. Прекращение использования
          </h2>

          <p className="text-gray-600 mb-4">
            Мы можем приостановить или прекратить доступ к платформе в случае:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Нарушения этих условий</li>
            <li>Мошеннической деятельности</li>
            <li>Незаконного использования платформы</li>
            <li>По требованию законных органов</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            12. Изменения условий
          </h2>

          <p className="text-gray-600 mb-6">
            Мы оставляем за собой право изменять эти условия в любое время. 
            Об изменениях пользователи уведомляются за 30 дней до вступления их в силу.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            13. Контактная информация
          </h2>

          <p className="text-gray-600 mb-4">
            По вопросам, связанным с этими условиями, пожалуйста, свяжитесь с нами:
          </p>
          <ul className="list-none pl-6 text-gray-600 space-y-2 mb-6">
            <li>Email: legal@3dprinthub.ru</li>
            <li>Телефон: +7 (999) 123-45-67</li>
            <li>Адрес: Москва, ул. Примерная, 123</li>
          </ul>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Последнее обновление: {currentDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
