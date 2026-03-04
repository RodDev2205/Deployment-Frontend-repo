# Professional Alert System

A modern, professional, and easy-to-use alert/dialog system for the POS and Inventory application.

## Overview

This system replaces browser `alert()` calls and scattered Notification components with a unified, professional alert dialog system with:

- ✅ **4 Alert Types**: Success, Error, Warning, Info
- ✅ **Confirmation Dialogs**: Single confirm, danger confirm
- ✅ **Beautiful UI**: Smooth animations, modern design
- ✅ **Easy to Use**: Simple API with `useAlert()` hook
- ✅ **Global State**: Works anywhere in the app
- ✅ **Customizable**: Control buttons, titles, messages, and more
- ✅ **Type Safe**: Built with modern React patterns

## Setup

The alert system is already integrated into the app via `AlertProvider` in `App.jsx`. No additional setup needed!

## Basic Usage

### 1. Import the Hook
```jsx
import { useAlert } from "@/context/AlertContext";
```

### 2. Get Methods from the Hook
```jsx
const { success, error, warning, info, confirm, danger } = useAlert();
```

### 3. Use in Your Component
```jsx
// Success Alert
success("Success!", "Item created successfully.");

// Error Alert
error("Error", "Failed to load data. Please try again.");

// Warning Alert
warning("Warning", "This action may affect your data.");

// Info Alert
info("Information", "Session expires in 5 minutes.");

// Confirmation
confirm(
  "Confirm Delete?",
  "Are you sure? This cannot be undone.",
  () => {
    // User confirmed
    deleteItem();
  }
);

// Danger Alert (red button for destructive actions)
danger(
  "Delete Item",
  "Are you sure? This action is permanent.",
  () => {
    // User confirmed deletion
    deleteItem();
  }
);
```

## Common Patterns

### Pattern 1: API Call with Alert

```jsx
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      success("Created!", "Item added successfully.");
      loadItems(); // Refresh list
    } else {
      error("Error", data.message || "Failed to create item.");
    }
  } catch (err) {
    error("Error", err.message || "An error occurred.");
  }
};
```

### Pattern 2: Form Validation

```jsx
const handleSubmit = (e) => {
  e.preventDefault();

  // Validation
  if (!name.trim()) {
    error("Validation Error", "Name is required.");
    return;
  }

  if (price <= 0) {
    error("Validation Error", "Price must be greater than 0.");
    return;
  }

  // If validation passes, submit
  submitForm();
};
```

### Pattern 3: Delete Confirmation

```jsx
const handleDelete = (itemId) => {
  danger(
    "Delete Item?",
    "Are you sure you want to delete this item? This cannot be undone.",
    async () => {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          success("Deleted", "Item has been deleted.");
          loadItems();
        } else {
          error("Error", "Failed to delete item.");
        }
      } catch (err) {
        error("Error", err.message);
      }
    }
  );
};
```

### Pattern 4: Confirmation with Callback

```jsx
const handleApprove = (menuItemId) => {
  confirm(
    "Approve Item?",
    "Are you sure you want to approve this menu item?",
    async () => {
      try {
        const response = await fetch(`/api/menu/${menuItemId}/approve`, {
          method: 'PUT',
        });

        if (response.ok) {
          success("Approved", "Item has been approved.");
          refreshMenuList();
        }
      } catch (err) {
        error("Error", err.message);
      }
    }
  );
};
```

## Available Methods

### Success Alert
```jsx
success(title, message, onConfirm?)
// Example:
success("Success!", "Operation completed.");
```

### Error Alert
```jsx
error(title, message, onConfirm?)
// Example:
error("Error", "Failed to save changes.");
```

### Warning Alert
```jsx
warning(title, message, onConfirm?)
// Example:
warning("Warning", "This action may have side effects.");
```

### Info Alert
```jsx
info(title, message, onConfirm?)
// Example:
info("Info", "Session expires soon.");
```

### Confirmation Dialog
```jsx
confirm(title, message, onConfirm, onCancel?)
// Example:
confirm(
  "Confirm?",
  "Are you sure?",
  () => { /* confirmed */ },
  () => { /* cancelled */ }
);
```

### Danger Alert (for destructive actions)
```jsx
danger(title, message, onConfirm, onCancel?)
// Example:
danger(
  "Delete?",
  "This cannot be undone.",
  () => { /* delete confirmed */ }
);
```

### Full Control
```jsx
const { showAlert, closeAlert } = useAlert();

showAlert({
  type: 'warning',
  title: 'Custom Alert',
  message: 'Full control example',
  confirmText: 'Yes',
  cancelText: 'No',
  showConfirmButton: true,
  showCancelButton: true,
  isDanger: false,
  onConfirm: () => { /* ... */ },
});
```

## Migration from Old Alerts

Replace all `alert()` calls with the new system:

### Before
```jsx
alert("Please fill in all fields");
if (confirm("Delete this item?")) {
  deleteItem();
}
```

### After
```jsx
const { error, danger } = useAlert();

error("Validation Error", "Please fill in all fields");
danger("Delete Item?", "Are you sure?", () => deleteItem());
```

## Component Details

### AlertDialog Component
Located at: `src/components/common/AlertDialog.jsx`

Features:
- Clean, modern UI with smooth animations
- Icon support for different alert types
- Customizable buttons
- Close button and backdrop click to close
- Responsive design

### AlertContext & useAlert Hook
Located at: `src/context/AlertContext.jsx`

Features:
- Global state management
- Convenience methods (success, error, warning, info, confirm, danger)
- Full control with showAlert method
- Clean context provider for App.jsx

## Styling

The alerts use Tailwind CSS with:
- **Success**: Green colors with checkmark icon
- **Error**: Red colors with alert icon
- **Warning**: Yellow colors with warning triangle
- **Info**: Blue colors with info icon

All colors follow the existing design system in the app.

## Best Practices

1. **Always use specific titles**: "Error" vs "Failed to Save"
2. **Keep messages clear and actionable**: "Please fill in the required fields" vs "Error"
3. **Use danger() for destructive actions**: Delete, Disable, Remove
4. **Handle errors in try-catch**: Always catch async errors
5. **Callback is optional**: Use it only when you need to do something after closing
6. **Close alerts automatically**: Most alerts close on button click automatically

## Files Modified

- `src/App.jsx` - Wrapped with AlertProvider
- Created: `src/components/common/AlertDialog.jsx` - Alert UI component
- Created: `src/context/AlertContext.jsx` - Alert context and hook
- Created: `src/ALERT_SYSTEM_GUIDE.jsx` - Usage examples
- Created: `ALERT_SYSTEM_README.md` - This documentation

## Next Steps

1. **Find and replace old alerts**: Search for `alert(` in the codebase
2. **Update components**: Use `useAlert()` instead
3. **Test the system**: Review alerts with the new UI
4. **Provide feedback**: Report any issues or suggestions

## Questions?

Refer to `src/ALERT_SYSTEM_GUIDE.jsx` for complete examples and patterns.
