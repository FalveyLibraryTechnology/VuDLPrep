class JobController < ApplicationController
  def index
    render json: CategoryCollection.new(holdingPath).json
  end
end
