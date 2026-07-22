# Toast Notification System - Implementation Guide

## Overview
The toast notification system is now ready to use throughout your app. It uses Redux for state management and supports multiple toast types with auto-dismissal.

## Toast Types Available

### 1. **Success** ✅
Used when an action completes successfully.
```javascript
showToast({
  type: 'success',
  message: 'Form duplicated successfully',
});
```

### 2. **Error** ❌
Used when an action fails.
```javascript
showToast({
  type: 'error',
  message: 'Failed to delete form. Try again.',
  action: {
    label: 'Retry',
    onClick: () => {
      // Handle retry logic
    },
  },
});
```

### 3. **Warning** ⚠️
Used for warnings or important notices.
```javascript
showToast({
  type: 'warning',
  message: "You're approaching your 500 response limit",
  action: {
    label: 'Upgrade',
    onClick: () => {
      // Handle upgrade
    },
  },
});
```

### 4. **Info** ℹ️
Used for informational messages.
```javascript
showToast({
  type: 'info',
  message: 'Form settings have been saved',
});
```

### 5. **Undo** ↩️
Used for actions that can be undone.
```javascript
showToast({
  type: 'undo',
  message: '"Exit interview — HR" moved to Archive',
  action: {
    label: 'Undo',
    onClick: () => {
      // Handle undo logic
    },
  },
});
```

## How to Add Triggers

### Step 1: Import the Hook
In any component where you want to show toasts:

```javascript
import { useToast } from '../hooks/useToast';
```

### Step 2: Use the Hook
```javascript
const MyComponent = () => {
  const { showToast } = useToast();

  return (
    <button onClick={() => showToast({ type: 'success', message: 'Done!' })}>
      Click me
    </button>
  );
};
```

### Step 3: Add Triggers to Your Actions
When you perform an action (create, delete, update, etc.):

```javascript
const handleDeleteForm = async (formId) => {
  try {
    await deleteForm(formId);
    showToast({
      type: 'success',
      message: 'Form deleted successfully',
    });
  } catch (error) {
    showToast({
      type: 'error',
      message: 'Failed to delete form. Try again.',
      action: {
        label: 'Retry',
        onClick: () => handleDeleteForm(formId),
      },
    });
  }
};
```

## Full Example Component

```javascript
import { useToast } from '../hooks/useToast';

const FormActions = () => {
  const { showToast } = useToast();

  const handleDuplicate = async () => {
    try {
      // API call to duplicate
      await api.duplicateForm();
      showToast({
        type: 'success',
        message: 'Form duplicated successfully',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to duplicate. Try again.',
        action: {
          label: 'Retry',
          onClick: handleDuplicate,
        },
      });
    }
  };

  const handleArchive = async (formName) => {
    try {
      // API call to archive
      await api.archiveForm();
      showToast({
        type: 'undo',
        message: `"${formName}" moved to Archive`,
        action: {
          label: 'Undo',
          onClick: async () => {
            await api.restoreForm();
          },
        },
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to archive form',
      });
    }
  };

  return (
    <div>
      <button onClick={handleDuplicate}>Duplicate</button>
      <button onClick={() => handleArchive('My Form')}>Archive</button>
    </div>
  );
};

export default FormActions;
```

## Configuration Options

### showToast(options)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | 'info' | Toast type: 'success', 'error', 'warning', 'info', 'undo' |
| `message` | string | '' | Main message to display |
| `duration` | number | 3000 | Auto-dismiss time in milliseconds |
| `action` | object | null | Optional action button |
| `action.label` | string | - | Button text (e.g., 'Retry', 'Undo') |
| `action.onClick` | function | - | Callback when button is clicked |

## Where to Add Triggers

1. **Form Actions**: When creating, updating, deleting, duplicating forms
2. **User Invitations**: When inviting members succeeds/fails
3. **Settings Changes**: When saving settings
4. **Link Operations**: When copying or publishing links
5. **Export/Import**: When exporting or connecting to external services
6. **Validation Errors**: When form submission fails
7. **File Operations**: When uploading, archiving, or restoring

## Files Created/Modified

### New Files:
- `src/redux/slices/toastSlice.js` - Redux slice for toast state
- `src/hooks/useToast.js` - Custom hook to trigger toasts
- `src/components/ui/Toast.jsx` - Individual toast component
- `src/components/ui/ToastContainer.jsx` - Container to display all toasts

### Modified Files:
- `src/redux/store.js` - Added toast reducer
- `src/App.jsx` - Added ToastContainer

## Tips

- **Keep messages short and clear** (max 2 lines)
- **Use success toasts for positive confirmation**
- **Use error toasts with action buttons for recoverable errors**
- **Use warning for important notices**
- **Stack up to 3 toasts maximum** (auto-dismiss helps)
- **Don't overlap with other UI elements** (positioned at bottom-center)

## Styling

If you need to customize colors, edit the `getToastConfig()` function in `Toast.jsx`:

```javascript
success: {
  bgColor: '#dbeafe',     // Background
  borderColor: '#86efac', // Border
  textColor: '#166534',   // Text
  icon: RiCheckLine,
  iconColor: '#16a34a',   // Icon
},
```
