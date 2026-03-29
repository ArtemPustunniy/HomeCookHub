export const RECIPES_QUERY = `
  query Recipes($search: String, $cuisine: String, $difficulty: String, $tag: String, $maxTime: Int, $page: Int, $limit: Int) {
    recipes(search: $search, cuisine: $cuisine, difficulty: $difficulty, tag: $tag, maxTime: $maxTime, page: $page, limit: $limit) {
      total
      items {
        id title cookingTime difficulty cuisine tags coverImage
        ingredients { id name amount unit }
        instructions nutrition { calories protein carbs fat fiber }
        authorId authorName averageRating ratingCount
        ratings { userId rating }
        comments { id recipeId authorId authorName content createdAt updatedAt }
        createdAt updatedAt
      }
    }
  }
`

export const RECIPE_QUERY = `
  query Recipe($id: ID!) {
    recipe(id: $id) {
      id title cookingTime difficulty cuisine tags coverImage
      ingredients { id name amount unit }
      instructions nutrition { calories protein carbs fat fiber }
      authorId authorName averageRating ratingCount
      ratings { userId rating }
      comments { id recipeId authorId authorName content createdAt updatedAt }
      createdAt updatedAt
    }
  }
`

export const RECIPE_RATING_QUERY = `
  query RecipeRating($recipeId: ID!) {
    recipeRating(recipeId: $recipeId)
  }
`

export const CREATE_RECIPE_MUTATION = `
  mutation CreateRecipe($input: RecipeFormInput!) {
    createRecipe(input: $input) {
      id title cookingTime difficulty cuisine tags coverImage
      ingredients { id name amount unit }
      instructions nutrition { calories protein carbs fat fiber }
      authorId authorName averageRating ratingCount
      ratings { userId rating }
      comments { id recipeId authorId authorName content createdAt updatedAt }
      createdAt updatedAt
    }
  }
`

export const UPDATE_RECIPE_MUTATION = `
  mutation UpdateRecipe($id: ID!, $input: RecipeFormInput!) {
    updateRecipe(id: $id, input: $input) {
      id title cookingTime difficulty cuisine tags coverImage
      ingredients { id name amount unit }
      instructions nutrition { calories protein carbs fat fiber }
      authorId authorName averageRating ratingCount
      ratings { userId rating }
      comments { id recipeId authorId authorName content createdAt updatedAt }
      createdAt updatedAt
    }
  }
`

export const DELETE_RECIPE_MUTATION = `
  mutation DeleteRecipe($id: ID!) {
    deleteRecipe(id: $id)
  }
`

export const ADD_COMMENT_MUTATION = `
  mutation AddComment($recipeId: ID!, $content: String!) {
    addComment(recipeId: $recipeId, content: $content) {
      id recipeId authorId authorName content createdAt updatedAt
    }
  }
`

export const UPDATE_COMMENT_MUTATION = `
  mutation UpdateComment($recipeId: ID!, $commentId: ID!, $content: String!) {
    updateComment(recipeId: $recipeId, commentId: $commentId, content: $content) {
      id recipeId authorId authorName content createdAt updatedAt
    }
  }
`

export const DELETE_COMMENT_MUTATION = `
  mutation DeleteComment($recipeId: ID!, $commentId: ID!) {
    deleteComment(recipeId: $recipeId, commentId: $commentId)
  }
`

export const SET_RATING_MUTATION = `
  mutation SetRating($recipeId: ID!, $rating: Int!) {
    setRating(recipeId: $recipeId, rating: $rating) {
      id averageRating ratingCount ratings { userId rating }
    }
  }
`

export const PLANNER_QUERY = `
  query Planner($weekStart: String) {
    planner(weekStart: $weekStart) {
      weekStart
      days { date recipeIds }
    }
  }
`

export const ADD_RECIPE_TO_PLANNER_MUTATION = `
  mutation AddRecipeToPlanner($weekStart: String, $dayIndex: Int!, $recipeId: ID!) {
    addRecipeToPlanner(weekStart: $weekStart, dayIndex: $dayIndex, recipeId: $recipeId) {
      weekStart days { date recipeIds }
    }
  }
`

export const REMOVE_RECIPE_FROM_PLANNER_MUTATION = `
  mutation RemoveRecipeFromPlanner($weekStart: String, $dayIndex: Int!, $recipeId: ID!) {
    removeRecipeFromPlanner(weekStart: $weekStart, dayIndex: $dayIndex, recipeId: $recipeId) {
      weekStart days { date recipeIds }
    }
  }
`

export const MOVE_RECIPE_IN_PLANNER_MUTATION = `
  mutation MoveRecipeInPlanner($recipeId: ID!, $weekStart: String!, $fromDayIndex: Int!, $toDayIndex: Int!) {
    moveRecipeInPlanner(recipeId: $recipeId, weekStart: $weekStart, fromDayIndex: $fromDayIndex, toDayIndex: $toDayIndex) {
      weekStart days { date recipeIds }
    }
  }
`

export const CLEAR_PLANNER_DAY_MUTATION = `
  mutation ClearPlannerDay($weekStart: String, $dayIndex: Int!) {
    clearPlannerDay(weekStart: $weekStart, dayIndex: $dayIndex) {
      weekStart days { date recipeIds }
    }
  }
`

export const CLEAR_PLANNER_WEEK_MUTATION = `
  mutation ClearPlannerWeek($weekStart: String) {
    clearPlannerWeek(weekStart: $weekStart) {
      weekStart days { date recipeIds }
    }
  }
`

export const FAVORITES_QUERY = `
  query Favorites {
    favorites {
      userId recipeIds
    }
  }
`

export const IS_FAVORITE_QUERY = `
  query IsFavorite($recipeId: ID!) {
    isFavorite(recipeId: $recipeId)
  }
`

export const ADD_FAVORITE_MUTATION = `
  mutation AddFavorite($recipeId: ID!) {
    addFavorite(recipeId: $recipeId) {
      userId recipeIds
    }
  }
`

export const REMOVE_FAVORITE_MUTATION = `
  mutation RemoveFavorite($recipeId: ID!) {
    removeFavorite(recipeId: $recipeId) {
      userId recipeIds
    }
  }
`

export const SHOPPING_LIST_QUERY = `
  query ShoppingList {
    shoppingList {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const GENERATE_SHOPPING_LIST_MUTATION = `
  mutation GenerateShoppingList($recipeIds: [ID!]!) {
    generateShoppingList(recipeIds: $recipeIds) {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const ADD_SHOPPING_LIST_ITEM_MUTATION = `
  mutation AddShoppingListItem($name: String!, $amount: Float, $unit: String) {
    addShoppingListItem(name: $name, amount: $amount, unit: $unit) {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const UPDATE_SHOPPING_LIST_ITEM_MUTATION = `
  mutation UpdateShoppingListItem($itemId: ID!, $name: String, $amount: Float, $unit: String, $purchased: Boolean) {
    updateShoppingListItem(itemId: $itemId, name: $name, amount: $amount, unit: $unit, purchased: $purchased) {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const DELETE_SHOPPING_LIST_ITEM_MUTATION = `
  mutation DeleteShoppingListItem($itemId: ID!) {
    deleteShoppingListItem(itemId: $itemId) {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const TOGGLE_SHOPPING_LIST_ITEM_PURCHASED_MUTATION = `
  mutation ToggleShoppingListItemPurchased($itemId: ID!) {
    toggleShoppingListItemPurchased(itemId: $itemId) {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`

export const CLEAR_SHOPPING_LIST_MUTATION = `
  mutation ClearShoppingList {
    clearShoppingList {
      id items { id name amount unit purchased }
      createdAt updatedAt
    }
  }
`
