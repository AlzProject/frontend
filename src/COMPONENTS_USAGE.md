# Reusable Assessment Components

This directory contains a set of reusable React components designed for building mental health and cognitive assessment interfaces.

## Components

### 1. MultipleChoiceQuestion

Used for single-select (radio) or multi-select (checkbox) questions.

**Props:**
- `title` (string): The question text.
- `description` (string, optional): Additional instructions.
- `options` (array): Array of objects `{ label: string, value: any }`.
- `selectedValues` (array): Array of currently selected values.
- `onChange` (function): Callback receiving the new array of selected values.
- `type` (string): `'single'` or `'multi'`. Default is `'single'`.
- `layout` (string): `'vertical'` or `'horizontal'`. Default is `'vertical'`.

**Usage:**
```jsx
import MultipleChoiceQuestion from './components/QuestionTypes/MultipleChoiceQuestion';

<MultipleChoiceQuestion
  title="Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?"
  options={[
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]}
  selectedValues={[selectedValue]}
  onChange={(newValues) => setSelectedValue(newValues[0])}
  type="single"
/>
```

### 2. LikertScaleQuestion

Used for rating scales, common in psychological questionnaires (e.g., PHQ-9, GAD-7).

**Props:**
- `title` (string): The question text.
- `description` (string, optional): Additional instructions.
- `options` (array): Array of objects `{ label: string, value: any }`.
- `selectedValue` (any): The currently selected value.
- `onChange` (function): Callback receiving the selected value.

**Usage:**
```jsx
import LikertScaleQuestion from './components/QuestionTypes/LikertScaleQuestion';

<LikertScaleQuestion
  title="How would you rate your current stress level?"
  options={[
    { label: 'Very Low', value: 1 },
    { label: 'Low', value: 2 },
    { label: 'Moderate', value: 3 },
    { label: 'High', value: 4 },
    { label: 'Very High', value: 5 },
  ]}
  selectedValue={stressLevel}
  onChange={setStressLevel}
/>
```

### 3. TextResponseQuestion

Used for open-ended questions, naming tasks, or short answer recall.

**Props:**
- `title` (string): The question text.
- `description` (string, optional): Additional instructions.
- `value` (string): The current text value.
- `onChange` (function): Callback receiving the new text string.
- `placeholder` (string, optional): Placeholder text.
- `multiline` (boolean): If `true`, renders a textarea. Default `false`.
- `rows` (number): Number of rows for textarea. Default `4`.

**Usage:**
```jsx
import TextResponseQuestion from './components/QuestionTypes/TextResponseQuestion';

<TextResponseQuestion
  title="What is the date today?"
  value={dateAnswer}
  onChange={setDateAnswer}
  placeholder="e.g., January 1, 2024"
/>
```

### 4. DrawingCanvasQuestion

Used for visuospatial tasks like the Clock Drawing Test (CDT) or figure copying.

**Props:**
- `title` (string): The question text.
- `description` (string, optional): Additional instructions.
- `onSave` (function): Callback receiving the data URL of the drawing when finished.
- `width` (number): Canvas width. Default `500`.
- `height` (number): Canvas height. Default `400`.
- `backgroundImage` (string, optional): URL of an image to draw over (e.g., for figure copying).

**Usage:**
```jsx
import DrawingCanvasQuestion from './components/QuestionTypes/DrawingCanvasQuestion';

<DrawingCanvasQuestion
  title="Clock Drawing Test"
  description="Draw a clock face with all the numbers and set the hands to 10 past 11."
  onSave={(dataUrl) => handleSaveDrawing(dataUrl)}
/>
```

## General Notes

- All components are wrapped in a `QuestionWrapper` that provides consistent styling (white card, shadow, title).
- Ensure you handle the state (e.g., `selectedValues`, `value`) in the parent component.
- These components are designed to be responsive and accessible.

## Implementing Common Test Types

Here is how to map common cognitive test requirements to these components:

### Yes/No Questions
Use `MultipleChoiceQuestion` with `type="single"`.
```jsx
<MultipleChoiceQuestion
  title="Do you have any trouble with your memory?"
  options={[
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ]}
  selectedValues={[answer]}
  onChange={(val) => setAnswer(val[0])}
/>
```

### Orientation Questions (Date, Time, Place)
Use `TextResponseQuestion` for specific answers.
```jsx
<TextResponseQuestion
  title="What is the year?"
  value={year}
  onChange={setYear}
/>
```

### Memory Recall (Immediate/Delayed)
Use `TextResponseQuestion` for the user to type back words.
```jsx
<TextResponseQuestion
  title="Please type the words you remember."
  value={recallText}
  onChange={setRecallText}
  multiline={true}
/>
```

### Naming Objects
Display an image (using standard `<img>` tag or passing it as children) and use `TextResponseQuestion`.
```jsx
<QuestionWrapper title="Naming Task">
  <img src="/lion.jpg" alt="Animal to name" className="mb-4 w-64 h-64 object-cover rounded" />
  <TextResponseQuestion
    title="What is the name of this animal?"
    value={animalName}
    onChange={setAnimalName}
  />
</QuestionWrapper>
```

### Figure Copying
Use `DrawingCanvasQuestion` with a `backgroundImage` or display the target image above.
```jsx
<div className="flex flex-col items-center">
  <img src="/cube.png" alt="Cube to copy" className="mb-4" />
  <DrawingCanvasQuestion
    title="Copy the drawing above"
    onSave={handleSave}
  />
</div>
```

