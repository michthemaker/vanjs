## How It Works:

**1. Build Time (Vite Plugin)**

- Detects `van.state()` calls → injects unique HMR IDs
- Wraps PascalCase functions (components) → tracks execution
- Injects HMR runtime and accept handlers

**2. Runtime (Browser)**

- Wraps `van.state` → preserves state across reloads using HMR IDs
- Wraps `van.add` → tracks which components were added where
- On HMR update → re-executes component functions and replaces old DOM elements

**3. Key Insights**

- State lives in a registry by ID → survives module reload
- Component instances track their container and element → enables precise replacement
- We track the factory function (`fn`) not just the result → can re-execute with new code

## The Flow:

```
User edits counter.ts
  ↓
Vite detects change
  ↓
Plugin transforms code (adds IDs, wraps components)
  ↓
Browser reloads module
  ↓
van.state checks registry → restores old values
  ↓
Component re-executes with new code + old state
  ↓
van.add replacement → swaps old DOM with new
  ↓
✅ UI updated, state preserved!
```

// Text input section
div(
{ style: "margin-bottom: 20px; padding: 15px; border: 2px solid #2196F3; border-radius: 8px;" },
h1("Text Input Test"),
p(() => `You typed: "${textInput.val}"`),
input({
type: "text",
value: () => textInput.val,
oninput: (e) => textInput.val = (e.target as HTMLInputElement).value,
style: "padding: 8px; font-size: 16px; width: 300px;"
}),
),

    // Cell members list
    div(
      { style: "margin-bottom: 20px; padding: 15px; border: 2px solid #FF9800; border-radius: 8px;" },
      h1("Cell Members (Nested List)"),
      div(
        () =>
          cellMembers.val.map((member: any) => [
            h1({ style: "margin: 5px 0;" }, member.name),
            p({ style: "margin: 5px 0;" }, `${member.age} years old`),
          ])
      ),
      button(
        {
          onclick: () => {
            cellMembers.val = [
              ...cellMembers.val,
              { name: `Person ${cellMembers.val.length + 1}`, age: Math.floor(Math.random() * 50) + 18 }
            ];
          },
          style: "margin: 5px; padding: 10px 20px; cursor: pointer;"
        },
        "Add Member"
      ),
    ),

    // Cars list
    div(
      { style: "margin-bottom: 20px; padding: 15px; border: 2px solid #9C27B0; border-radius: 8px;" },
      h1("Cars (Simple List)"),
      div(
        () => cars.val.map((car: any) => div(
          { style: "margin: 10px 0;" },
          h1({ style: "margin: 5px 0;" }, car.name),
          p({ style: "margin: 5px 0;" }, `${car.year} model`)
        ))
      ),
      button(
        {
          onclick: () => {
            const brands = ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Ford'];
            cars.val = [
              ...cars.val,
              { name: brands[Math.floor(Math.random() * brands.length)], year: 2020 + cars.val.length }
            ];
          },
          style: "margin: 5px; padding: 10px 20px; cursor: pointer;"
        },
        "Add Car"
      ),
    ),

    Video()

export const Video = () => {
const videoCounter = **VAN_HMR**.createState('main.ts:Video:counter', 0);

return div(
{ style: "margin-bottom: 20px; padding: 15px; border: 2px solid #607D8B; border-radius: 8px;" },
h1("Video Component"),
p(() => `Video button clicked: ${videoCounter.val} times`),
button(
{
onclick: () => {
videoCounter.val++;
console.log("Video button clicked!", videoCounter.val);
},
style: "margin: 5px; padding: 10px 20px; cursor: pointer; background: #009688; color: white;"
},
"Click me (Video component)"
)
);
};
