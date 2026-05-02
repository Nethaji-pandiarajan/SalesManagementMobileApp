# Database Architecture References & Logic

## Queries

### Vehicle-Based Selling (Daily Revenue)
```sql
SELECT vehicleId, SUM(totalBillAmount) 
FROM Sales_Invoices 
GROUP BY vehicleId, date;
```

### Shop Pending & Paid Amount (Accounts Receivable)

**Pending Report:**
```sql
SELECT shopId, SUM(pendingAmount) 
FROM Sales_Invoices 
WHERE pendingAmount > 0;
```

**Paid Report:**
```sql
SELECT shopId, SUM(paidAmount) 
FROM Sales_Invoices;
```

### Non-Selling Units (Dead Stock)
This is achieved by comparing your SupplyManagement (Loaded) with your Sales_Items (Sold).

**Formula:** 
`quantityLoaded - (Sum of quantitySold for that supplyId and productId)`

**Non-Selling Report:** 
Any `productId` where total `quantitySold` is 0 for that day.

### Shop Purchase Per Day
Join `Sales_Items` with `Sales_Invoices` to see exactly what each shop bought.

**Query:**
```sql
SELECT shopId, productId, SUM(quantitySold) 
FROM Sales_Items 
JOIN Sales_Invoices ... 
GROUP BY shopId, date;
```

## Handling the "Pending Amount" Logic

When a shop owner has a pending amount, it is technically "Credit." To manage this professionally:

1. **At the time of Sale:** The Driver enters the quantity for 2-3 products. The App calculates `Total = 1500`. If the owner pays 500, the App saves `pendingAmount = 1000`.

2. **Next Visit:** When the driver visits the same shop tomorrow, the Java app should fetch the sum of all `pendingAmount` for that `shopId` and show it as "Previous Balance."

3. **Collection Only:** If the driver collects the pending ₹1000 without selling any new oil, you create a new record in `Sales_Invoices` where `totalBillAmount = 0`, `paidAmount = 1000`, and `pendingAmount = -1000`. This clears the debt.

### For pending amount

**The "Live" Calculation:**
$$Current Pending = (Previous Pending + New TotalAmount) - Current paidAmount$$
