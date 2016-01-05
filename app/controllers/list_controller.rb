class ListController < ApplicationController
  before_action :validate_token

  def index
    render json: CategoryCollection.new(holding_path).raw
  end

  def category
    path = category_path(params)
    if !Dir.exists? path
      render status: 404, json: { error: "Category not found" }
    else
      render json: Category.new(path).raw
    end
  end
end
