<script>
  import { onMount } from 'svelte';
  import { debounce } from 'lodash';

  import Sortable from 'sortablejs';
	import API from '$lib/api/api';

  let query = '';
  let suggestions = [];
  let selectedSteps = [];
  let variables = {};
  let listEl;

  // Fetch suggestions
  const fetchSuggestions = debounce(async () => {

    if (query.length < 2) {
      suggestions = [];
      return;
    }
    const res = await API.get(`/code_flow_elements?query=${query}`);
    suggestions = res;
  }, 300);

  function handleSelect(element) {
    const variableMatches = [...element.title.matchAll(/%{(.+?)}%/g)].map(m => m[1]);

    const resolvedVars = {};
    for (let variable of variableMatches) {
      const userValue = prompt(`Enter value for: ${variable}`);
      if (!userValue) return;
      resolvedVars[variable] = userValue;
      variables[variable] = userValue;
    }

    let finalTitle = element.title;
    for (const key in resolvedVars) {
      finalTitle = finalTitle.replaceAll(`%{${key}}%`, resolvedVars[key]);
    }

    selectedSteps = [...selectedSteps, { ...element, finalTitle }];
    query = '';
    suggestions = [];
  }

  onMount(() => {
    Sortable.create(listEl, {
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        const moved = selectedSteps.splice(oldIndex, 1)[0];
        selectedSteps.splice(newIndex, 0, moved);
        selectedSteps = [...selectedSteps];
      }
    });
  });
</script>

<div class="container mt-4">
  <h3>Code Flow Writer</h3>

  <!-- Search Input -->
  <div class="mb-3">
    <input
      type="text"
      class="form-control"
      placeholder="Search code flow elements..."
      bind:value={query}
      on:input={fetchSuggestions}
    />

    {#if suggestions.length > 0}
      <ul class="list-group mt-1">
        {#each suggestions as suggestion}
          <li class="list-group-item list-group-item-action" on:click={() => handleSelect(suggestion)}>
            {suggestion.title}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Flow Builder List -->
  <div class="mb-4">
    <h5>Flow Steps</h5>
    <ul class="list-group" bind:this={listEl}>
      {#each selectedSteps as step, i (step.finalTitle)}
        <li class="list-group-item">
          {i + 1}. {step.finalTitle}
        </li>
      {/each}
    </ul>
  </div>

  <!-- Variables Sidebar -->
  <div class="mb-4">
    <h5>Variables</h5>
    <ul class="list-group">
      {#each Object.entries(variables) as [key, value]}
        <li class="list-group-item">
          <strong>{key}:</strong> {value}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  ul.list-group li:hover {
    cursor: grab;
  }
</style>
