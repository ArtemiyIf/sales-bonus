/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const {discount, sale_price, quantity} = purchase;
    const finalDiscount = 1 - (discount / 100);
    return sale_price * quantity * finalDiscount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    //@TODO: Расчет бонуса от позиции в рейтинге
       const max_bonus = 0.15;    // для первого места (максимальная прибыль)
    const high_bonus = 0.10;   // для второго и третьего места
    const low_bonus = 0.05;    // для промежуточных мест
    const min_bonus = 0.00;    // для последнего места

    // Проверяем позицию продавца и рассчитываем бонус
    if (index === 0) {
        return seller.profit * max_bonus;    // первое место
    } else if (index === 1 || index === 2) {
        return seller.profit * high_bonus;   // второе или третье место
    } else if (index === total - 1) {
        return seller.profit * min_bonus;    // последнее место
    } else {
        return seller.profit * low_bonus;    // все остальные позиции
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
     if (!data //проверяем, сущ ли вообще такая переменная
        || !Array.isArray(data.customers) //проверяем, является ли массивом
        || !Array.isArray(data.products)
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.purchase_records)
        || data.customers.length === 0 //проверяем, не являются лли массивы пустыми
        || data.products.length === 0
        || data.sellers.length === 0
        || data.purchase_records.length === 0) {
            throw new Error('Некорректные входные данные');
        }
    

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function'
     || typeof calculateBonus !== 'function') {
        throw new Error('Недопустимые опции');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
     const sellerStats = data.sellers.map(seller => ({
         id: seller.id,
        name: seller.first_name + " " + seller.last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        top_products: {},
        products_sales: {},
        bonus: 0
     }))

     const productsStats = data.products.map(product => ({
        'name': product.name,
        'category': product.category,
        'sku': product.sku,
        'purchase_price': product.purchase_price,
        'sale_price': product.sale_price

     }))

    // @TODO: Индексация продавцов и товаров для быстрого доступа
      const sellerIndex = sellerStats.reduce((acc, obj) => ({...acc, [obj.id]: obj}), {})
      const productIndex = productsStats.reduce((acc, obj) => ({
        ...acc,
        [obj.sku]: obj
    }), {}
    )

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;
        seller.revenue += record.total_amount;


        // Расчёт прибыли для каждого товара
           record.items.forEach(item => {
               const product = productIndex[item.sku];
               // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
               const cost = product.purchase_price * item.quantity;
               // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
               const revenue = calculateRevenue(item, product);
               // Посчитать прибыль: выручка минус себестоимость
               const profit = revenue - cost;
               // Увеличить общую накопленную прибыль (profit) у продавца
               seller.profit += profit;
               // Учёт количества проданных товаров
                if (!seller.products_sales[item.sku]) {
                seller.products_sales[item.sku] = 0;
            };
            //по артикулу товара увеличиваем его кол-во у продавца
            seller.products_sales[item.sku] += item.quantity;
    })
})

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((sel1, sel2) => {
        if (sel1.profit > sel2.profit) return -1;
        else if (sel1.profit < sel2.profit) return 1;
        return 0;
    })

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller); // расчёт бонусов функцией calculateBonus
        seller.products_sales = Object.entries(seller.products_sales).map(item => item);
        seller.products_sales.sort((pr1, pr2) => {
            if (pr1[1] > pr2[1]) return -1;
            else if (pr1[1] < pr2[1]) return 1;
            return 0;
        })
        seller.products_sales = seller.products_sales.slice(0, 10);
    })

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: parseFloat(seller.revenue.toFixed(2)),
        // revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.products_sales.map(product => ({ sku: product[0], quantity: product[1]})), // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2),// Число с двумя знаками после точки, бонус продавца
})); 
}


