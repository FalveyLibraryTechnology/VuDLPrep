task :ingest => :environment do
  
  CategoryCollection.new(ApplicationController.new.holding_path).categories.each do |category|
    category.jobs.each do |job|
      job.ingest
    end
  end
end