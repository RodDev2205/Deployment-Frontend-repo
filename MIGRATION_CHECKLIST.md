# Alert System Migration Checklist

This document lists all files that use the old `alert()` function and need to be migrated to the new Alert System.

## Files to Migrate

### High Priority (Core Features)

- [ ] `src/components/menu/EditItemModal.jsx`
  - Line 62-66: Multiple validation alerts
  - Line 91: Update failed alert
  - Line 93: General error alert

- [ ] `src/components/POScomponent/Modal/PaymentModal.jsx`
  - Line 33: Amount validation alerts
  - Line 37: Payment validation alert

- [ ] `src/components/management/tabs/MenuListTab.jsx`
  - Line 53: Note validation alert

- [ ] `src/components/InventoryManagement.jsx` (in inventory folder)
  - Multiple alerts for ingredient validation

### Medium Priority (Management)

- [ ] `src/components/menu/EditDeclinedModal.jsx`
  - Line 94: General error alert

- [ ] `src/components/POScomponent/Modal/ReceiptModal.jsx`
  - Line 40: Printer error alert
  - Line 42: General print error alert

- [ ] `src/components/management/AddCashier.jsx`
  - Error handling alerts

### Low Priority (Pages)

- [ ] `src/pages/ReportPage.jsx`
  - Error handling (currently using console.error)

- [ ] `src/pages/LogsPage.jsx`
  - Error handling (currently using console.error)

## Migration Template

When updating a file, follow this pattern:

### Before
```jsx
import React, { useState } from 'react';

export default function MyComponent() {
  const handleSubmit = () => {
    if (!data) {
      alert("Data is required");
      return;
    }
    // ... rest of logic
  };
}
```

### After
```jsx
import React, { useState } from 'react';
import { useAlert } from '@/context/AlertContext';

export default function MyComponent() {
  const { error, success } = useAlert();

  const handleSubmit = () => {
    if (!data) {
      error("Validation Error", "Data is required");
      return;
    }
    // ... rest of logic
  };
}
```

## Common Replacements

### Validation Error
```jsx
// Before
alert("Please fill in all fields");

// After
error("Validation Error", "Please fill in all fields");
```

### Success Message
```jsx
// Before
alert("Success! Item created.");

// After
success("Success", "Item created successfully.");
```

### Delete Confirmation
```jsx
// Before
if (confirm("Delete this item?")) {
  deleteItem();
}

// After
danger("Delete Item?", "Are you sure? This cannot be undone.", () => {
  deleteItem();
});
```

### API Error
```jsx
// Before
catch (err) {
  alert("Failed to load data");
}

// After
catch (err) {
  error("Error", err.message || "Failed to load data");
}
```

## Progress Tracking

Update the checkboxes as you migrate each file:

- [ ] EditItemModal.jsx
- [ ] PaymentModal.jsx
- [ ] MenuListTab.jsx
- [ ] InventoryManagement.jsx
- [ ] EditDeclinedModal.jsx
- [ ] ReceiptModal.jsx
- [ ] AddCashier.jsx
- [ ] ReportPage.jsx
- [ ] LogsPage.jsx

## Testing

After migrating a file:
1. Test all alert triggers in that component
2. Verify alert type (success, error, warning, info)
3. Check button text and callbacks
4. Ensure modal closes properly

## Questions?

Refer to:
- `ALERT_SYSTEM_README.md` - Full documentation
- `src/ALERT_SYSTEM_GUIDE.jsx` - Code examples
- `src/context/AlertContext.jsx` - Hook implementation
- `src/components/common/AlertDialog.jsx` - UI component
