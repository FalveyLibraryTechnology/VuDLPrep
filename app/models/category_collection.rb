class CategoryCollection
  attr_reader :dir, :categories

  def initialize(dir)
    @dir = dir
    @categories = []
    Dir.glob("#{dir}/*").sort.each do |dir|
      @categories.push(Category.new dir)
    end
  end

  def raw
    categories.map do |category|
      category.raw
    end
  end
end